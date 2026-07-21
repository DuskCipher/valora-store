import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import styles from './TagInput.module.css';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = "Tambahkan tag..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <div 
        className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className={styles.tagsContainer}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
              <button 
                type="button" 
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val.endsWith(',')) {
                handleAddTag(val.slice(0, -1));
              } else {
                setInputValue(val);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (inputValue.trim()) {
                // optionally we could add it, but it might interfere with clicking the dropdown.
                // handleAddTag(inputValue);
              }
            }}
            placeholder={tags.length === 0 ? placeholder : ''}
          />
        </div>
        <div className={styles.icons}>
          {tags.length > 0 && (
            <button 
              type="button"
              className={styles.clearAllBtn}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            >
              <X size={16} />
            </button>
          )}
          <div className={styles.divider} />
          <ChevronDown size={18} className={styles.chevron} />
        </div>
      </div>

      {isFocused && inputValue.trim() && (
        <div className={styles.dropdown}>
          <div 
            className={styles.createOption}
            onClick={() => handleAddTag(inputValue)}
          >
            Create &quot;{inputValue}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
