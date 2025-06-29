import { useState, useEffect } from 'react';

interface TypingEffectProps {
  prompts: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
  className?: string;
}

export function TypingEffect({
  prompts,
  speed = 60,
  deleteSpeed = 30,
  pauseTime = 1200,
  className = '',
}: TypingEffectProps) {
  const [placeholder, setPlaceholder] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentPrompt = prompts[typingIndex];

    if (!isDeleting && charIndex < currentPrompt.length) {
      timeout = setTimeout(() => {
        setPlaceholder(currentPrompt.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, speed);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setPlaceholder(currentPrompt.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, deleteSpeed);
    } else {
      timeout = setTimeout(() => {
        if (!isDeleting) {
          setIsDeleting(true);
        } else {
          setIsDeleting(false);
          setTypingIndex((typingIndex + 1) % prompts.length);
        }
      }, pauseTime);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, typingIndex, prompts, speed, deleteSpeed, pauseTime]);

  return <span className={className}>{placeholder}</span>;
}
