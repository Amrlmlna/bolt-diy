import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect, useCallback } from 'react';
import { atom } from 'nanostores';
import { generateId, type JSONValue, type Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { logStore } from '~/lib/stores/logs';
import { saveChatToDatabase, getChatFromDatabase, updateChatDescriptionInDatabase } from './database';
import type { FileMap } from '~/lib/stores/files';
import { webcontainer } from '~/lib/webcontainer';
import { detectProjectCommands, createCommandActionsString } from '~/utils/projectCommands';
import type { ContextAnnotation } from '~/types/context';

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
  metadata?: any;
}

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);
export const chatMetadata = atom<any | undefined>(undefined);

export function useChatHistory() {
  const navigate = useNavigate();
  const { id: mixedId } = useLoaderData<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();

  useEffect(() => {
    if (mixedId) {
      // Load from database only, no IndexedDB fallback
      const loadChat = async () => {
        try {
          const storedMessages = await getChatFromDatabase(mixedId);
          if (storedMessages && storedMessages.messages.length > 0) {
            setInitialMessages(storedMessages.messages);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description);
            chatId.set(storedMessages.id);
            chatMetadata.set(storedMessages.metadata);
            setReady(true);
            return;
          } else {
            navigate('/', { replace: true });
          }
        } catch (error) {
          console.error('Failed to load chat from database:', error);
          setReady(true);
        }
      };
      loadChat();
    } else {
      setReady(true);
    }
  }, [mixedId, navigate, searchParams]);

  const takeSnapshot = useCallback(async (chatId: string, messages: Message[], files: FileMap) => {
    // Store snapshot in localStorage for now (could be moved to database later)
    try {
      const snapshot = {
        chatIndex: messages[messages.length - 1]?.id || '',
        files,
        summary: undefined,
      };
      localStorage.setItem(`snapshot:${chatId}`, JSON.stringify(snapshot));
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    }
  }, []);

  const restoreSnapshot = useCallback(async (chatId: string) => {
    try {
      const snapshotData = localStorage.getItem(`snapshot:${chatId}`);
      if (snapshotData) {
        const snapshot = JSON.parse(snapshotData);
        if (snapshot?.files) {
          const container = await webcontainer;

          Object.entries(snapshot.files).forEach(async ([key, value]: [string, any]) => {
            if (key.startsWith(container.workdir)) {
              key = key.replace(container.workdir, '');
            }

            if (value?.type === 'folder') {
              await container.fs.mkdir(key, { recursive: true });
            }
          });

          Object.entries(snapshot.files).forEach(async ([key, value]: [string, any]) => {
            if (value?.type === 'file') {
              if (key.startsWith(container.workdir)) {
                key = key.replace(container.workdir, '');
              }

              await container.fs.writeFile(key, value.content, { encoding: value.isBinary ? undefined : 'utf8' });
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
    }
  }, []);

  return {
    ready: !mixedId || ready,
    initialMessages,
    archivedMessages,
    urlId,
    takeSnapshot,
    restoreSnapshot,
    updateChatMestaData: async (metadata: any) => {
      const id = chatId.get();

      if (!id) {
        return;
      }

      try {
        // Update metadata in database
        await updateChatDescriptionInDatabase(id, description.get() || '');
        chatMetadata.set(metadata);
      } catch (error) {
        console.error('Failed to update chat metadata:', error);
      }
    },
    storeMessageHistory: async (messages: Message[]) => {
      if (messages.length === 0) {
        return;
      }

      const { firstArtifact } = workbenchStore;
      messages = messages.filter((m) => !m.annotations?.includes('no-store'));

      let _urlId = urlId;

      if (!urlId && firstArtifact?.id) {
        _urlId = firstArtifact.id;
        navigateChat(_urlId);
        setUrlId(_urlId);
      }

      let chatSummary: string | undefined = undefined;
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.role === 'assistant') {
        const annotations = lastMessage.annotations as JSONValue[];
        const filteredAnnotations = (annotations?.filter(
          (annotation: JSONValue) =>
            annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
        ) || []) as { type: string; value: any } & { [key: string]: any }[];

        if (filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')) {
          chatSummary = filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')?.summary;
        }
      }

      takeSnapshot(messages[messages.length - 1].id, messages, workbenchStore.files.get());

      if (!description.get() && firstArtifact?.title) {
        description.set(firstArtifact?.title);
      }

      if (initialMessages.length === 0 && !chatId.get()) {
        const nextId = generateId();
        chatId.set(nextId);

        if (!urlId) {
          navigateChat(nextId);
        }
      }

      const finalChatId = chatId.get();

      if (!finalChatId) {
        console.error('Cannot save messages, chat ID is not set.');
        return;
      }

      // Save to database only
      try {
        await saveChatToDatabase({
          id: finalChatId,
          urlId: _urlId,
          description: description.get(),
          messages: [...archivedMessages, ...messages],
          timestamp: new Date().toISOString(),
          metadata: chatMetadata.get(),
        });
      } catch (error) {
        console.error('Failed to save chat messages:', error);
      }
    },
    duplicateCurrentChat: async (listItemId: string) => {
      if (!mixedId && !listItemId) {
        return;
      }

      try {
        const chatToDuplicate = await getChatFromDatabase(mixedId || listItemId);
        if (chatToDuplicate) {
          const newId = generateId();
          const newChat: ChatHistoryItem = {
            ...chatToDuplicate,
            id: newId,
            description: `${chatToDuplicate.description} (Copy)`,
            timestamp: new Date().toISOString(),
          };

          await saveChatToDatabase(newChat);
          navigate(`/chat/${newId}`);
          toast.success('Chat duplicated successfully');
        }
      } catch (error) {
        console.error('Failed to duplicate chat:', error);
        toast.error('Failed to duplicate chat');
      }
    },
    importChat: async (description: string, messages: Message[], metadata?: any) => {
      try {
        const newId = generateId();
        const newChat: ChatHistoryItem = {
          id: newId,
          description,
          messages,
          timestamp: new Date().toISOString(),
          metadata,
        };

        await saveChatToDatabase(newChat);
        window.location.href = `/chat/${newId}`;
        toast.success('Chat imported successfully');
      } catch (error) {
        console.error('Failed to import chat:', error);
        toast.error('Failed to import chat');
      }
    },
    exportChat: async (id = urlId) => {
      if (!id) {
        return;
      }

      try {
        const chat = await getChatFromDatabase(id);
        if (chat) {
          const chatData = {
            messages: chat.messages,
            description: chat.description,
            exportDate: new Date().toISOString(),
          };

          const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chat-${new Date().toISOString()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Failed to export chat:', error);
        toast.error('Failed to export chat');
      }
    },
  };
}

function navigateChat(nextId: string) {
  const currentPath = window.location.pathname;
  const newPath = `/chat/${nextId}`;

  if (currentPath !== newPath) {
    window.history.replaceState({}, '', newPath);
  }
}
