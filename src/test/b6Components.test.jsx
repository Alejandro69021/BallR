import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import AthleticProgressChart from '../components/growth/AthleticProgressChart';
import BioMaturityCard from '../components/growth/BioMaturityCard';
import AnthropometryLogTable from '../components/growth/AnthropometryLogTable';
import GrowthBioBandingTab from '../components/GrowthBioBandingTab';
import OfficialDossierFooter from '../components/OfficialDossierFooter';

// Mock Supabase fetchAcademyAccreditation
vi.mock('../lib/supabase', () => ({
  fetchAcademyAccreditation: vi.fn().mockResolvedValue(null)
}));

describe('B6: Growth Screen & Cleanups Tests', () => {
  describe('1. AthleticProgressChart True Time Scale X Positions', () => {
    it('chart X positions are proportional to real calendar dates (2 weeks vs 5 months apart)', () => {
      // Point 0: 2026-01-01
      // Point 1: 2026-01-15 (14 days = 2 weeks later)
      // Point 2: 2026-06-15 (151 days = ~5 months later, total 165 days)
      const testMetricsData = {
        height: {
          name: 'Tinggi badan (cm)',
          unit: 'cm',
          markerShape: 'circle',
          minVal: 150,
          maxVal: 160,
          points: [
            { date: '2026-01-01', displayDate: '1 Jan', value: 152.0 },
            { date: '2026-01-15', displayDate: '15 Jan', value: 152.5 },
            { date: '2026-06-15', displayDate: '15 Jun', value: 155.0 }
          ]
        }
      };

      const { container } = render(
        <AthleticProgressChart
          activeMetric="height"
          setActiveMetric={() => {}}
          selectedPointIndex={0}
          setSelectedPointIndex={() => {}}
          metricsData={testMetricsData}
        />
      );

      // Find all interactive marker groups (each has role="button")
      const markers = container.querySelectorAll('g[role="button"]');
      expect(markers.length).toBe(3);

      // Query circle elements to inspect computed CX positions
      const circles = container.querySelectorAll('g[role="button"] circle');
      expect(circles.length).toBe(3);

      const x0 = parseFloat(circles[0].getAttribute('cx'));
      const x1 = parseFloat(circles[1].getAttribute('cx'));
      const x2 = parseFloat(circles[2].getAttribute('cx'));

      // Total distance
      const totalDist = x2 - x0;
      const dist01 = x1 - x0;
      const dist12 = x2 - x1;

      // Distance for 2 weeks must be much smaller than distance for 5 months
      expect(dist01).toBeLessThan(dist12);

      // Proportional ratio: 14 days / 165 days ≈ 0.0848
      const ratio01 = dist01 / totalDist;
      expect(ratio01).toBeGreaterThanOrEqual(0.07);
      expect(ratio01).toBeLessThanOrEqual(0.10);
    });

    it('displays subtitle "Sumbu Y dibalik: waktu lebih rendah = lebih cepat" when sprint axis is inverted', () => {
      const testMetricsData = {
        sprint: {
          name: 'Sprint 20m (detik)',
          unit: 'detik',
          invertY: true,
          minVal: 3.3,
          maxVal: 3.7,
          points: [
            { date: '2026-05-15', displayDate: '15 Mei', value: 3.65 },
            { date: '2026-10-15', displayDate: '15 Okt', value: 3.42 }
          ]
        }
      };

      render(
        <AthleticProgressChart
          activeMetric="sprint"
          setActiveMetric={() => {}}
          selectedPointIndex={1}
          setSelectedPointIndex={() => {}}
          metricsData={testMetricsData}
        />
      );

      expect(
        screen.getByText(/Sumbu Y dibalik: waktu lebih rendah = lebih cepat/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Sumber: pengukuran akademi · n=2/i)).toBeInTheDocument();
    });
  });

  describe('2. BioMaturityCard Data Honesty & Empty State', () => {
    it('renders empty state explaining required measurements when inputs are missing', () => {
      render(<BioMaturityCard bioSpecs={{ inputsMissing: true }} />);

      expect(screen.getByText(/Data pengukuran belum lengkap/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Dibutuhkan data tinggi badan anak, berat badan, tanggal lahir, dan tinggi badan kedua orang tua kandung/i)
      ).toBeInTheDocument();
    });

    it('renders empty state when bioSpecs is null or empty', () => {
      render(<BioMaturityCard bioSpecs={null} />);

      expect(screen.getByText(/Data pengukuran belum lengkap/i)).toBeInTheDocument();
    });

    it('renders honest stature values and adult height unavailable notice without fabricated numbers', () => {
      const populatedSpecs = {
        currentHeight: 158.0,
        currentWeight: 46.0,
        chronologicalAge: 13,
        methodName: 'Khamis-Roche (1994)',
        date: '15 Okt 2026'
      };

      render(<BioMaturityCard bioSpecs={populatedSpecs} />);

      expect(
        screen.getByText(/Prediksi tinggi dewasa belum tersedia: butuh tabel koefisien Khamis-Roche dari sumber primer dan tinggi kedua orang tua\./i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/174\.5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/68\.2/)).not.toBeInTheDocument();
      expect(screen.getByText(/158/)).toBeInTheDocument();
      expect(screen.getByText(/46 kg/)).toBeInTheDocument();
      expect(
        screen.getByText(/Estimasi, bukan diagnosis; galat umum beberapa cm\./i)
      ).toBeInTheDocument();
    });
  });

  describe('3. AnthropometryLogTable Age Calculation & Units', () => {
    it('computes age from birth date and measurement date, and displays units in headers', () => {
      const sampleLogs = [
        {
          date: '2026-10-15',
          period: '15 Okt 2026',
          height: 158.0,
          weight: 46.0,
          sitting_height: 84.0,
          isLatest: true
        }
      ];

      render(
        <AnthropometryLogTable
          anthropometryLogs={sampleLogs}
          birthDate="2013-04-12"
        />
      );

      // Headers check
      expect(screen.getByText('Tinggi badan (cm)')).toBeInTheDocument();
      expect(screen.getByText('Berat badan (kg)')).toBeInTheDocument();
      expect(screen.getByText('Tinggi duduk (cm)')).toBeInTheDocument();

      // Age calculation: 2026-10-15 minus 2013-04-12 = 13 years 6 months
      expect(screen.getByText('13 th 6 bln')).toBeInTheDocument();
      expect(screen.getByText('158.0')).toBeInTheDocument();
      expect(screen.getByText('46.0')).toBeInTheDocument();
      expect(screen.getByText('84.0')).toBeInTheDocument();
    });

    it('renders honest "Belum ada data" empty state when logs array is empty', () => {
      render(<AnthropometryLogTable anthropometryLogs={[]} birthDate="2013-04-12" />);

      expect(screen.getByText('Belum ada data')).toBeInTheDocument();
      expect(
        screen.getByText(/Belum ada catatan pengukuran antropometri berkala/i)
      ).toBeInTheDocument();
    });
  });

  describe('4. OfficialDossierFooter Cleanup (PSSI Fallback Removal)', () => {
    const samplePlayer = {
      player_id: 'p-01',
      public_id: 'WK-2026-0042',
      personal_info: {
        full_name: 'Dimas Arya Pratama',
        nickname: 'Arya',
        jersey_number: 10,
        position: 'Attacking Midfielder',
        preferred_foot: 'Both',
        academy: { id: 'acad-01', name: 'Mataram Putra FA', city: 'Yogyakarta' }
      }
    };

    it('removes fallback "PSSI" and shows only registration number when accreditation_body is empty', async () => {
      const { fetchAcademyAccreditation } = await import('../lib/supabase');
      vi.mocked(fetchAcademyAccreditation).mockResolvedValueOnce({
        registration_number: 'REG-998877',
        accreditation_body: ''
      });

      render(
        <MemoryRouter>
          <OfficialDossierFooter player={samplePlayer} />
        </MemoryRouter>
      );

      // Wait for async accreditation check
      const regBadge = await screen.findByText('Reg: REG-998877');
      expect(regBadge).toBeInTheDocument();

      // In the status grid: should show only REG-998877 without 'PSSI'
      expect(screen.queryByText(/PSSI/)).not.toBeInTheDocument();
      expect(screen.getByText('REG-998877')).toBeInTheDocument();
    });

    it('omits registration status row when both accreditation_body and registration_number are empty', async () => {
      const { fetchAcademyAccreditation } = await import('../lib/supabase');
      vi.mocked(fetchAcademyAccreditation).mockResolvedValueOnce(null);

      render(
        <MemoryRouter>
          <OfficialDossierFooter player={samplePlayer} />
        </MemoryRouter>
      );

      // "Status registrasi" row should be omitted
      expect(screen.queryByText(/Status registrasi/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/PSSI/)).not.toBeInTheDocument();
    });
  });

  describe('5. Zero Forbidden Claims (Top tier, Elite, akselerasi) in Growth Files', () => {
    const growthFiles = [
      path.resolve(__dirname, '../pages/GrowthPage.jsx'),
      path.resolve(__dirname, '../components/GrowthBioBandingTab.jsx'),
      path.resolve(__dirname, '../components/growth/BioMaturityCard.jsx'),
      path.resolve(__dirname, '../components/growth/AnthropometryLogTable.jsx'),
      path.resolve(__dirname, '../components/growth/AthleticProgressChart.jsx')
    ];

    growthFiles.forEach((file) => {
      const fileName = path.basename(file);
      const content = fs.readFileSync(file, 'utf-8');

      it(`verifies ${fileName} contains no "Top tier", "Elite", or "akselerasi"`, () => {
        expect(content).not.toMatch(/Top\s*tier/i);
        expect(content).not.toMatch(/\bElite\b/i);
        expect(content).not.toMatch(/akselerasi/i);
      });
    });

    it('GrowthBioBandingTab renders without any forbidden words', () => {
      render(
        <GrowthBioBandingTab
          player={{
            player_id: 'p-01',
            personal_info: {
              full_name: 'Dimas Arya Pratama',
              height_cm: 158,
              weight_kg: 46,
              birth_date: '2013-04-12'
            }
          }}
        />
      );

      expect(screen.queryByText(/Top tier/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Elite/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/akselerasi/i)).not.toBeInTheDocument();
    });
  });
});
