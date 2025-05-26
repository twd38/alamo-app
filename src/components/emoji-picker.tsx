'use client'
import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

type EmojiPickerComponentProps = {
    icon?: string;
    onEmojiClick: (emojiData: EmojiClickData) => void;
    className?: string;
}

export default function EmojiPickerComponent({ icon, onEmojiClick, className }: EmojiPickerComponentProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  return (
    <div>
        <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex h-10 w-10 text-xl items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${className}`}
            >
            {icon || '🇺🇸'}
        </button>
        <div className="absolute z-50 mt-2">
            <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                open={showEmojiPicker} 
                width={300} 
                height={400}
                previewConfig={{
                    showPreview: false
                }}
            />
        </div>
    </div>
  )
}