"use client";

import React, { useRef, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Type,
  Undo,
  Redo,
} from "lucide-react";
import styles from "./RichTextEditor.module.css";

interface RichTextEditorProps {
  placeholder?: string;
  onChange?: (html: string) => void;
  initialValue?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  placeholder = "Tulis sesuatu...",
  onChange,
  initialValue = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync initialValue into editor when data loads (e.g. after async fetch)
  useEffect(() => {
    if (editorRef.current && initialValue) {
      // Only update if editor is currently empty to avoid overwriting user edits
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === "") {
        editorRef.current.innerHTML = initialValue;
      }
    }
  }, [initialValue]);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Trigger onChange
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    const url = prompt("Masukkan URL:");
    if (url) {
      exec("createLink", url);
    }
  };

  const setFontFamily = (font: string) => {
    exec("fontName", font);
  };

  const setBlockFormat = (format: string) => {
    exec("formatBlock", format);
  };

  const setForeColor = () => {
    const color = prompt("Masukkan kode warna (contoh: #ff0000):", "#000000");
    if (color) exec("foreColor", color);
  };

  const setBackColor = () => {
    const color = prompt("Masukkan kode warna highlight (contoh: #ffff00):", "#ffff00");
    if (color) exec("hiliteColor", color);
  };

  return (
    <div className={styles.editorWrapper}>
      {/* Toolbar Row 1 */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => setBlockFormat("h1")}
          title="Heading 1"
        >
          <strong>H<sub>1</sub></strong>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => setBlockFormat("h2")}
          title="Heading 2"
        >
          <strong>H<sub>2</sub></strong>
        </button>

        <select
          className={styles.toolbarSelect}
          onChange={(e) => setFontFamily(e.target.value)}
          defaultValue="sans-serif"
        >
          <option value="sans-serif">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="cursive">Cursive</option>
        </select>

        <div className={styles.toolbarDivider} />

        <select
          className={styles.toolbarSelect}
          onChange={(e) => {
            if (e.target.value === "p") {
              setBlockFormat("p");
            } else {
              setBlockFormat(e.target.value);
            }
            e.target.value = "p"; // reset
          }}
          defaultValue="p"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Blockquote</option>
        </select>

        <div className={styles.toolbarDivider} />

        <button type="button" className={styles.toolbarBtn} onClick={() => exec("bold")} title="Bold">
          <Bold size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("italic")} title="Italic">
          <Italic size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("underline")} title="Underline">
          <Underline size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("strikeThrough")} title="Strikethrough">
          <Strikethrough size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("formatBlock", "blockquote")} title="Quote">
          <Quote size={15} />
        </button>

        <div className={styles.toolbarDivider} />

        <button type="button" className={styles.toolbarBtn} onClick={() => exec("insertOrderedList")} title="Ordered List">
          <ListOrdered size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("insertUnorderedList")} title="Unordered List">
          <List size={15} />
        </button>
      </div>

      {/* Toolbar Row 2 */}
      <div className={styles.toolbar} style={{ borderTop: "none" }}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={setForeColor}
          title="Warna Teks"
          style={{ fontWeight: 700, fontSize: 15 }}
        >
          A
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={setBackColor}
          title="Warna Highlight"
          style={{
            fontWeight: 700,
            fontSize: 15,
            backgroundColor: "#1e293b",
            color: "#fff",
            borderRadius: 3,
          }}
        >
          A
        </button>

        <div className={styles.toolbarDivider} />

        <button type="button" className={styles.toolbarBtn} onClick={() => exec("justifyLeft")} title="Rata Kiri">
          <AlignLeft size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("justifyCenter")} title="Rata Tengah">
          <AlignCenter size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("justifyRight")} title="Rata Kanan">
          <AlignRight size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("justifyFull")} title="Rata Kiri-Kanan">
          <AlignJustify size={15} />
        </button>

        <div className={styles.toolbarDivider} />

        <button type="button" className={styles.toolbarBtn} onClick={insertLink} title="Sisipkan Link">
          <Link2 size={15} />
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => exec("removeFormat")} title="Hapus Format">
          <Type size={15} />
        </button>
      </div>

      {/* Editor Body */}
      <div
        ref={editorRef}
        className={styles.editorBody}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={undefined}
      />
    </div>
  );
};
