import type { MouseEvent, KeyboardEvent, TouchEvent } from 'react';
import {
  MouseSensor as LibMouseSensor,
  KeyboardSensor as LibKeyboardSensor,
  TouchSensor as LibTouchSensor
} from '@dnd-kit/core';

export class MouseSensor extends LibMouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: ({ nativeEvent: event }: MouseEvent) => {
        return shouldHandleEvent(event.target as HTMLElement);
      }
    }
  ];
}

export class KeyboardSensor extends LibKeyboardSensor {
  static activators = [
    {
      eventName: 'onKeyDown' as const,
      handler: ({ nativeEvent: event }: KeyboardEvent<Element>) => {
        return shouldHandleEvent(event.target as HTMLElement);
      }
    }
  ];
}

export class TouchSensor extends LibTouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: ({ nativeEvent: event }: TouchEvent) => {
        return shouldHandleEvent(event.target as HTMLElement);
      }
    }
  ];
}

function shouldHandleEvent(element: HTMLElement | null) {
  let cur = element;

  while (cur) {
    if (cur.dataset && cur.dataset.noDnd) {
      return false;
    }
    cur = cur.parentElement;
  }

  return true;
}
