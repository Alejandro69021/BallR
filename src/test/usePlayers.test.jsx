import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { PlayersProvider } from '../context/PlayersContext';
import { usePlayers } from '../hooks/usePlayers';

describe('usePlayers & usePlayer hooks', () => {
  it('throws error when used outside of PlayersProvider', () => {
    expect(() => renderHook(() => usePlayers())).toThrow(
      'usePlayersContext must be used within a PlayersProvider'
    );
  });

  it('provides players and loading state inside PlayersProvider', async () => {
    const wrapper = ({ children }) => <PlayersProvider>{children}</PlayersProvider>;
    const { result } = renderHook(() => usePlayers(), { wrapper });

    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('players');
    expect(result.current).toHaveProperty('saveAssessment');
  });
});
