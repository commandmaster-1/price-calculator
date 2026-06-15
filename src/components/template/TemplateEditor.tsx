import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TemplateEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function TemplateEditor({ value, onChange, disabled }: TemplateEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Vorlagentext eingeben…",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bold") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("italic") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bulletList") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("orderedList") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          <ListOrdered className="size-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className={cn(disabled && "opacity-60")}
      />
    </div>
  );
}