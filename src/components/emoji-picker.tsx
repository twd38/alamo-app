'use client'
import { useState } from 'react';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from 'next-themes';
type EmojiPickerComponentProps = {
    icon?: string;
    onEmojiClick: (emojiData: string) => void;
    className?: string;
}

export default function EmojiPickerComponent({ icon, onEmojiClick, className }: EmojiPickerComponentProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // get current theme
  const {theme} = useTheme();

  const handleEmojiClick = (emojiData: any) => {
    onEmojiClick(emojiData.native);
    setShowEmojiPicker(false);
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    // if click is outside of the emoji picker button, close the picker
    if (e.target instanceof HTMLElement && !e.target.closest('#emoji-picker-button')) {
      setShowEmojiPicker(false);
    }
  };
  
  return (
    <div>
        <button
            type="button"
            id="emoji-picker-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex h-10 w-10 text-xl items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${className}`}
            >
            {icon || '🇺🇸'}
        </button>
        {showEmojiPicker && (
            <div className="absolute z-50 mt-2 max-h-[434px] overflow-y-auto">
                <Picker
                    data={data} 
                    onEmojiSelect={handleEmojiClick} 
                    onClickOutside={handleClickOutside}
                    autoFocus={true}
                    previewPosition="none"
                    theme={theme}
                />
            </div>
        )}
    </div>
  )
}