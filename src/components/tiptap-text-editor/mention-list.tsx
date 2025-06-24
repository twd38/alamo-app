'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import { getUsersForMention, type MentionUser } from '@/lib/mention-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MentionUser[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command({
          id: item.id,
          label: item.name
        });
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      }
    }));

    if (items.length === 0) {
      return (
        <div className="relative rounded-md border border-input bg-popover p-1 shadow-md outline-none">
          <div className="flex items-center space-x-2 rounded-sm px-2 py-1 text-sm text-muted-foreground">
            No users found
          </div>
        </div>
      );
    }

    return (
      <div className="relative z-50 min-w-[200px] rounded-md border border-input bg-popover p-1 shadow-md outline-none">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={cn(
              'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:bg-accent focus:text-accent-foreground',
              index === selectedIndex && 'bg-accent text-accent-foreground'
            )}
            onClick={() => selectItem(index)}
          >
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={item.image || undefined} alt={item.name} />
              <AvatarFallback className="text-xs">
                {item.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.email}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';

// Simplified suggestion implementation
export function renderMentionList() {
  let popup: any;
  let listRef: MentionListRef | null = null;
  let root: any = null;
  let container: HTMLDivElement | null = null;

  const renderComponent = (props: any) => {
    const MentionListComponent = () => {
      const [users, setUsers] = useState<MentionUser[]>([]);
      const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
        async function fetchUsers() {
          setIsLoading(true);
          try {
            const result = await getUsersForMention(props.query, 10);
            if (result.success) {
              setUsers(result.data);
            } else {
              console.error('Failed to fetch users for mention:', result.error);
              setUsers([]);
            }
          } catch (error) {
            console.error('Failed to fetch users for mention:', error);
            setUsers([]);
          } finally {
            setIsLoading(false);
          }
        }

        // Debounce the search by 200ms
        const timeoutId = setTimeout(() => {
          fetchUsers();
        }, 200);

        return () => {
          clearTimeout(timeoutId);
        };
      }, [props.query]);

      if (isLoading) {
        return (
          <div className="relative rounded-md border border-input bg-popover p-1 shadow-md outline-none">
            <div className="flex items-center space-x-2 rounded-sm px-2 py-1 text-sm text-muted-foreground">
              Loading users...
            </div>
          </div>
        );
      }

      return (
        <MentionList
          ref={(ref) => {
            listRef = ref;
          }}
          items={users}
          command={props.command}
        />
      );
    };

    if (root) {
      root.render(<MentionListComponent />);
    }
  };

  return {
    onStart: async (props: any) => {
      if (!props.clientRect) {
        return;
      }

      // Dynamically import tippy only when needed
      const { default: tippy } = await import('tippy.js');

      // Create a container for our React component
      container = document.createElement('div');

      // Create a temporary reference element
      const referenceElement = document.createElement('div');
      document.body.appendChild(referenceElement);

      // Get the first instance from tippy (since it returns an array)
      const tippyInstances = tippy(referenceElement, {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: container,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start'
      });

      // Store the first (and only) instance
      popup = Array.isArray(tippyInstances)
        ? tippyInstances[0]
        : tippyInstances;

      // Create React root
      const { createRoot } = await import('react-dom/client');
      root = createRoot(container);

      // Initial render
      renderComponent(props);
    },

    onUpdate: async (props: any) => {
      if (!popup || !props.clientRect) {
        return;
      }

      popup.setProps({
        getReferenceClientRect: props.clientRect
      });

      // Re-render component with new query to update the user list
      renderComponent(props);
    },

    onKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        popup?.hide();
        return true;
      }

      return listRef?.onKeyDown(props) ?? false;
    },

    onExit: () => {
      popup?.destroy();
      popup = null;
      listRef = null;
      root = null;
      container = null;
    }
  };
}
