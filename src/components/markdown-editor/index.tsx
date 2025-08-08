'use client';
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  ImageResizer,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
  Placeholder
} from 'novel';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { defaultExtensions } from './extensions';
import { ColorSelector } from './selectors/color-selector';
import { LinkSelector } from './selectors/link-selector';
import { MathSelector } from './selectors/math-selector';
import { NodeSelector } from './selectors/node-selector';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';

import GenerativeMenuSwitch from './generative/generative-menu-switch';
import { uploadFn } from './image-upload';
import { TextButtons } from './selectors/text-buttons';
import { slashCommand, suggestionItems } from './slash-command';
import { ControllerRenderProps } from 'react-hook-form';
import { cn } from '@/lib/utils';
import hljs from 'highlight.js';

// const hljs = require('highlight.js');

interface MarkdownEditorProps {
  initialContent: string | null | undefined;
  updateContent: (content: string) => void;
  className?: string;
  field?: ControllerRenderProps;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  hideSaveStatus?: boolean;
  hideWordCount?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}

const defaultInitialContent = `{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "marks": [
            {
              "type": "textStyle",
              "attrs": {
                "color": "#A8A29E"
              }
            }
          ],
          "text": "write something..."
        }
      ]
    }
  ]
}`;

export const MarkdownEditor = ({
  initialContent = defaultInitialContent,
  updateContent,
  className,
  size = 'base',
  hideSaveStatus = false,
  hideWordCount = false,
  placeholder = 'Start writing...',
  readOnly = false
}: MarkdownEditorProps) => {
  //   const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [charsCount, setCharsCount] = useState();
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(
    null
  );

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  // Image viewer state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  const baseExtensions = [
    ...defaultExtensions.filter((ext) => ext !== Placeholder),
    slashCommand
  ];
  const extensions = [
    ...baseExtensions,
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
      emptyNodeClass: 'is-empty',
      showOnlyWhenEditable: true,
      includeChildren: true
    })
  ] as any;

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    doc.querySelectorAll('pre code').forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const updateContentFunction = (editor: EditorInstance) => {
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());
    window.localStorage.setItem(
      'html-content',
      highlightCodeblocks(editor.getHTML())
    );
    window.localStorage.setItem('novel-content', JSON.stringify(json));
    window.localStorage.setItem(
      'markdown',
      editor.storage.markdown.getMarkdown()
    );
    setSaveStatus('Saved');

    updateContent(JSON.stringify(json));
  };

  const initialContentJson = initialContent ? JSON.parse(initialContent) : null;

  const handleContainerClick = () => {
    if (editorInstance) {
      editorInstance.commands.focus();
    }
  };

  return (
    <div
      className={cn(
        'relative w-full h-full',
        readOnly ? 'cursor-default' : 'cursor-text',
        className
      )}
      onClick={handleContainerClick}
    >
      <div className="flex absolute right-0 top-0 z-10 mb-5 gap-2">
        {!hideSaveStatus && (
          <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">
            {saveStatus}
          </div>
        )}
        {!hideWordCount && (
          <div
            className={
              charsCount
                ? 'rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground'
                : 'hidden'
            }
          >
            {charsCount} Words
          </div>
        )}
      </div>
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          initialContent={initialContentJson}
          extensions={extensions}
          className="relative w-full pb-8"
          editable={!readOnly}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
              click: (_view, event) => {
                const target = event.target as HTMLElement | null;
                if (target && target.tagName === 'IMG') {
                  event.preventDefault();
                  event.stopPropagation();
                  const imgEl = target as HTMLImageElement;
                  // Deselect node and blur before opening to avoid showing
                  // resize handles on simple clicks.
                  try {
                    editorInstance?.chain().setTextSelection(0).blur().run();
                  } catch {}
                  setImageToView(imgEl.src);
                  setImageDialogOpen(true);
                  return true;
                }
                return false;
              }
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class: `prose prose-${size} dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full prose-p:leading-tight`
            }
          }}
          onUpdate={({ editor }) => {
            if (!readOnly) {
              updateContentFunction(editor);
              setSaveStatus('Unsaved');
            }
          }}
          onCreate={({ editor }) => {
            setEditorInstance(editor);
          }}
          slotAfter={imageDialogOpen ? null : <ImageResizer />}
        >
          {!readOnly && (
            <>
              <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
                <EditorCommandEmpty className="px-2 text-muted-foreground">
                  No results
                </EditorCommandEmpty>
                <EditorCommandList>
                  {suggestionItems.map((item) => (
                    <EditorCommandItem
                      value={item.title}
                      onCommand={(val) => item.command?.(val)}
                      className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                      key={item.title}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </EditorCommandItem>
                  ))}
                </EditorCommandList>
              </EditorCommand>

              <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
                <Separator orientation="vertical" />
                <NodeSelector open={openNode} onOpenChange={setOpenNode} />
                <Separator orientation="vertical" />

                <LinkSelector open={openLink} onOpenChange={setOpenLink} />
                <Separator orientation="vertical" />
                <MathSelector />
                <Separator orientation="vertical" />
                <TextButtons />
                <Separator orientation="vertical" />
                <ColorSelector open={openColor} onOpenChange={setOpenColor} />
              </GenerativeMenuSwitch>
            </>
          )}
        </EditorContent>
      </EditorRoot>
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="z-[60] inset-0 w-screen h-[100vh] supports-[height:100svh]:h-[100svh] max-w-none p-[env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)] bg-transparent border-0 shadow-none sm:rounded-none">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {imageToView ? (
            <div
              className="flex items-center justify-center w-full h-full"
              onClick={() => setImageDialogOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageToView}
                alt="Preview"
                className="max-w-[95vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
