import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import Sound from 'react-native-sound';
import apiClient from '../api/client';

interface Track {
  id: string | number;
  title: string;
  artist: string;
  url: string;
  artwork: string;
  category: string;
}

interface MusicContextType {
  playlist: Track[];
  loading: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  loopMode: number;
  isShuffle: boolean;
  setLoopMode: (mode: number) => void;
  setIsShuffle: (shuffle: boolean) => void;
  handlePlayTrack: (track: Track) => void;
  togglePlayback: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  seekTo: (value: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

Sound.setCategory('Playback');

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopMode, setLoopMode] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);

  const soundRef = useRef<Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchMusic();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundRef.current) soundRef.current.release();
    };
  }, []);

  const fetchMusic = async () => {
    try {
      const response = await apiClient.get('/music/all');
      setPlaylist(response.data);
    } catch (err) {
      console.error('Fetch Music Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying && soundRef.current) {
      timerRef.current = setInterval(() => {
        soundRef.current?.getCurrentTime(seconds => setPosition(seconds));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handlePlayTrack = (track: Track) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (soundRef.current) {
      soundRef.current.stop().release();
    }

    const sound = new Sound(track.url, '', error => {
      if (error) {
        console.error('Failed to load sound', error);
        return;
      }
      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
      setDuration(sound.getDuration());
      setPosition(0);

      sound.play(success => {
        if (success) {
          if (loopMode === 2) {
            handlePlayTrack(track);
          } else if (loopMode === 1) {
            handleNext();
          } else {
            setIsPlaying(false);
            setPosition(0);
          }
        } else {
          setIsPlaying(false);
        }
      });
    });
  };

  const togglePlayback = () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
    } else {
      soundRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (!currentTrack || playlist.length === 0) return;
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    handlePlayTrack(playlist[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    handlePlayTrack(playlist[prevIndex]);
  };

  const seekTo = (value: number) => {
    if (soundRef.current) {
      soundRef.current.setCurrentTime(value);
      setPosition(value);
    }
  };

  return (
    <MusicContext.Provider
      value={{
        playlist,
        loading,
        currentTrack,
        isPlaying,
        position,
        duration,
        loopMode,
        isShuffle,
        setLoopMode,
        setIsShuffle,
        handlePlayTrack,
        togglePlayback,
        handleNext,
        handlePrevious,
        seekTo,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
};
