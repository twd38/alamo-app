'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { Mention } from '@tiptap/extension-mention';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  Unlink,
  AtSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { renderMentionList } from './mention-list';

interface TipTapTextEditorProps {
  /** Initial content as HTML string */
  initialContent?: string;
  /** Callback when content changes - receives HTML string */
  onContentChange?: (content: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Whether to hide the toolbar */
  hideToolbar?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Minimum height of the editor */
  minHeight?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Maximum character limit */
  characterLimit?: number;
  /** Keyboard shortcuts */
  onKeyDown?: (event: React.KeyboardEvent) => boolean | void;
  /** Submit button to display on the right side of the toolbar */
  submitButton?: React.ReactNode;
  /** Custom toolbar content - if provided, replaces the default toolbar */
  customToolbar?: (editor: any) => React.ReactNode;
  /** Enable user mentions */
  enableMentions?: boolean;
  /** Callback when users are mentioned */
  onMention?: (mentionedUserIds: string[]) => void;
}

export function TipTapTextEditor({
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing...',
  editable = true,
  hideToolbar = false,
  className,
  minHeight = '60px',
  autoFocus = false,
  characterLimit,
  onKeyDown,
  submitButton,
  customToolbar,
  enableMentions = false,
  onMention
}: TipTapTextEditorProps) {
  const [mentionedUsers, setMentionedUsers] = useState<Set<string>>(new Set());

  // Memoize the onUpdate callback to prevent editor recreation
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      if (onContentChange) {
        const html = editor.getHTML();
        onContentChange(html);
      }

      // Extract mentioned user IDs
      if (enableMentions && onMention) {
        const doc = editor.state.doc;
        const mentionedUserIds = new Set<string>();

        doc.descendants((node: any) => {
          if (node.type.name === 'mention') {
            mentionedUserIds.add(node.attrs.id);
          }
        });

        // Only call onMention if the set of mentioned users changed
        const currentMentions = Array.from(mentionedUserIds).sort().join(',');
        const previousMentions = Array.from(mentionedUsers).sort().join(',');

        if (currentMentions !== previousMentions) {
          setMentionedUsers(mentionedUserIds);
          onMention(Array.from(mentionedUserIds));
        }
      }
    },
    [onContentChange, enableMentions, onMention, mentionedUsers]
  );

  // Memoize the handleKeyDown to prevent editor recreation
  const handleKeyDown = useCallback(
    (view: any, event: any) => {
      if (onKeyDown) {
        const result = onKeyDown(event);
        if (result === false) return true; // Prevent default
      }
      return false;
    },
    [onKeyDown]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features to keep it simple
        heading: false,
        horizontalRule: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        history: {
          depth: 50
        }
      }),
      TextStyle,
      Bold,
      Italic,
      Underline,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-outside ml-4'
        }
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-outside ml-4'
        }
      }),
      ListItem,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            'text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer'
        }
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
        includeChildren: true
      }),
      // Add Mention extension only if enabled
      ...(enableMentions
        ? [
            Mention.configure({
              HTMLAttributes: {
                class:
                  'mention bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-1 py-0.5 rounded font-medium'
              },
              renderText({ options, node }) {
                return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
              },
              suggestion: {
                char: '@',
                startOfLine: false,
                command: ({ editor, range, props }) => {
                  // Remove the '@' character and insert the mention
                  editor
                    .chain()
                    .focus()
                    .insertContentAt(range, [
                      {
                        type: 'mention',
                        attrs: props
                      },
                      {
                        type: 'text',
                        text: ' '
                      }
                    ])
                    .run();
                },
                allow: ({ state, range }) => {
                  const $from = state.doc.resolve(range.from);
                  const type = state.schema.nodes.mention;
                  const allow =
                    !!$from.parent.type.contentMatch.matchType(type);
                  return allow;
                },
                render: renderMentionList
              }
            })
          ]
        : [])
    ],
    content: initialContent,
    editable,
    autofocus: autoFocus,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none p-3 focus:outline-none',
          'prose-p:my-1 prose-p:leading-normal prose-li:my-0',
          '[&_.is-editor-empty]:before:text-muted-foreground [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:h-0',
          // Mention-specific styles
          '[&_.mention]:bg-blue-100 [&_.mention]:text-blue-800 [&_.mention]:px-1 [&_.mention]:py-0.5 [&_.mention]:rounded [&_.mention]:font-medium',
          'dark:[&_.mention]:bg-blue-900 dark:[&_.mention]:text-blue-300'
        ),
        style: `min-height: ${minHeight};`
      },
      handleKeyDown
    }
  });

  // Update content when initialContent prop changes, but avoid unnecessary updates
  useEffect(() => {
    if (
      editor &&
      initialContent !== undefined &&
      initialContent !== editor.getHTML()
    ) {
      editor.commands.setContent(initialContent, false); // false = don't emit update event
    }
  }, [editor, initialContent]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const unsetLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const triggerMention = useCallback(() => {
    if (!editor || !enableMentions) return;

    // Insert @ character to trigger mention
    editor.chain().focus().insertContent('@').run();
  }, [editor, enableMentions]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background',
          !editable && 'cursor-default'
        )}
      >
        <EditorContent editor={editor} className="min-h-[60px]" />

        <div className="px-3 py-2 flex items-center gap-1">
          {/* Toolbar at the bottom */}
          {editable && !hideToolbar && (
            <>
              {/* Default toolbar buttons */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleBold}
                className={cn(
                  'h-8 w-8 p-0',
                  editor.isActive('bold') && 'bg-accent text-accent-foreground'
                )}
                title="Bold (Ctrl+B)"
              >
                <BoldIcon className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleItalic}
                className={cn(
                  'h-8 w-8 p-0',
                  editor.isActive('italic') &&
                    'bg-accent text-accent-foreground'
                )}
                title="Italic (Ctrl+I)"
              >
                <ItalicIcon className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleUnderline}
                className={cn(
                  'h-8 w-8 p-0',
                  editor.isActive('underline') &&
                    'bg-accent text-accent-foreground'
                )}
                title="Underline (Ctrl+U)"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleBulletList}
                className={cn(
                  'h-8 w-8 p-0',
                  editor.isActive('bulletList') &&
                    'bg-accent text-accent-foreground'
                )}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleOrderedList}
                className={cn(
                  'h-8 w-8 p-0',
                  editor.isActive('orderedList') &&
                    'bg-accent text-accent-foreground'
                )}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setLink}
                className={cn(
                  'h-8 w-8 p-0',
                  editor.isActive('link') && 'bg-accent text-accent-foreground'
                )}
                title="Add Link"
              >
                <Link2 className="h-4 w-4" />
              </Button>

              {editor.isActive('link') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={unsetLink}
                  className="h-8 w-8 p-0"
                  title="Remove Link"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              )}

              {/* Mention button */}
              {enableMentions && (
                <>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={triggerMention}
                    className="h-8 w-8 p-0"
                    title="Mention User (@)"
                  >
                    <AtSign className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Character count display - disabled for now */}
            </>
          )}
          {/* Custom toolbar content appended at the end */}
          {customToolbar && customToolbar(editor)}

          {/* Submit button */}
          {submitButton && <div className="ml-auto">{submitButton}</div>}
        </div>
      </div>
    </div>
  );
}
