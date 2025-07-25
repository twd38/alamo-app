'use client';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
type EmojiPickerComponentProps = {
  icon?: string;
  onEmojiClick: (emojiData: string) => void;
  className?: string;
};

export default function EmojiPickerComponent({
  icon,
  onEmojiClick,
  className
}: EmojiPickerComponentProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // get current theme
  const { theme } = useTheme();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        buttonRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        id="emoji-picker-button"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className={`flex h-10 w-10 text-xl items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${className}`}
      >
        {icon || '🇺🇸'}
      </button>
      {showEmojiPicker && (
        <div ref={pickerRef} className="absolute z-50 mt-2">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={true}
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            height={434}
            width={350}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}
