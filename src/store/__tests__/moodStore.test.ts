import { describe, it, expect, beforeEach } from 'vitest';
import { useMoodStore } from '@/store/moodStore';

describe('moodStore', () => {
  beforeEach(() => {
    useMoodStore.setState({ selectedEmotion: 'happy', mode: 'aggregate' });
  });

  it('default state: happy + aggregate', () => {
    const s = useMoodStore.getState();
    expect(s.selectedEmotion).toBe('happy');
    expect(s.mode).toBe('aggregate');
  });

  it('setSelectedEmotion updates', () => {
    useMoodStore.getState().setSelectedEmotion('calm');
    expect(useMoodStore.getState().selectedEmotion).toBe('calm');
  });

  it('toggleMode flips aggregate to single', () => {
    useMoodStore.getState().toggleMode();
    expect(useMoodStore.getState().mode).toBe('single');
  });

  it('toggleMode flips single back to aggregate', () => {
    useMoodStore.setState({ mode: 'single' });
    useMoodStore.getState().toggleMode();
    expect(useMoodStore.getState().mode).toBe('aggregate');
  });

  it('setSelectedEmotion preserves mode', () => {
    useMoodStore.setState({ mode: 'single' });
    useMoodStore.getState().setSelectedEmotion('anxious');
    const s = useMoodStore.getState();
    expect(s.selectedEmotion).toBe('anxious');
    expect(s.mode).toBe('single');
  });
});