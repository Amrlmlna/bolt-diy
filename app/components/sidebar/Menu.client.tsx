import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import { SettingsButton } from '~/components/ui/SettingsButton';
import { chatId, type ChatHistoryItem } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { useNavigate, useLocation } from '@remix-run/react';
import { getChatsFromDatabase, deleteChatFromDatabase, saveChatToDatabase } from '~/lib/persistence/database';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-340px',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent = { type: 'delete'; item: ChatHistoryItem } | null;

interface MenuProps {
  className?: string;
}

export function Menu({ className }: MenuProps) {
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const profile = useStore(profileStore);

  const loadChats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const chats = await getChatsFromDatabase();
      setList(chats);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setIsDeleting(true);
        await deleteChatFromDatabase(id);
        setList((prev) => prev.filter((chat) => chat.id !== id));

        // If we're currently viewing the deleted chat, navigate to home
        if (location.pathname === `/chat/${id}`) {
          navigate('/');
        }

        toast.success('Chat deleted successfully');
      } catch (error) {
        console.error('Failed to delete chat:', error);
        toast.error('Failed to delete chat');
      } finally {
        setIsDeleting(false);
      }
    },
    [navigate, location.pathname],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadChats();
    setIsRefreshing(false);
  }, [loadChats]);

  const handleItemClick = useCallback(
    (item: ChatHistoryItem) => {
      navigate(`/chat/${item.id}`);
      setIsOpen(false);
    },
    [navigate],
  );

  const handleDeleteClick = useCallback((item: ChatHistoryItem) => {
    setDialogContent({ type: 'delete', item });
  }, []);

  const handleDuplicate = useCallback(
    async (item: ChatHistoryItem) => {
      try {
        // Create a new chat with the same messages but different ID
        const newChat: ChatHistoryItem = {
          ...item,
          id: Date.now().toString(),
          description: `${item.description} (Copy)`,
          timestamp: new Date().toISOString(),
        };

        // Save to database
        await saveChatToDatabase(newChat);

        // Add to local list
        setList((prev) => [newChat, ...prev]);

        // Navigate to the new chat
        navigate(`/chat/${newChat.id}`);
        setIsOpen(false);

        toast.success('Chat duplicated successfully');
      } catch (error) {
        console.error('Failed to duplicate chat:', error);
        toast.error('Failed to duplicate chat');
      }
    },
    [navigate],
  );

  const groupedItems = binDates(list);

  return (
    <>
      <motion.div
        className={classNames(
          'fixed top-0 left-0 z-50 h-full w-[340px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg',
          className,
        )}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={menuVariants}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Refresh"
              >
                <div className={classNames('i-ph:arrow-clockwise text-lg', { 'animate-spin': isRefreshing })} />
              </button>
              <SettingsButton onClick={() => setIsSettingsOpen(true)} />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 text-center">
                <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>
                <button
                  onClick={loadChats}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!error && list.length === 0 && !isLoading && (
              <div className="p-8 text-center">
                <div className="i-ph:chat-circle-text text-4xl text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No chat history yet.</p>
              </div>
            )}

            {groupedItems.map((group) => (
              <div key={group.category} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {group.category}
                  </h3>
                </div>
                {group.items.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onDelete={() => handleDeleteClick(item)}
                    onDuplicate={() => handleDuplicate(item)}
                    exportChat={() => {}}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                {list.length} chat{list.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={dialogContent?.type === 'delete'} onOpenChange={() => setDialogContent(null)}>
        <Dialog>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{dialogContent?.type === 'delete' ? dialogContent.item.description : ''}"?
            This action cannot be undone.
          </DialogDescription>
          <div className="flex justify-end space-x-2 mt-4">
            <DialogButton type="secondary" onClick={() => setDialogContent(null)}>
              Cancel
            </DialogButton>
            <DialogButton
              type="danger"
              onClick={() => {
                if (dialogContent?.type === 'delete') {
                  handleDelete(dialogContent.item.id);
                  setDialogContent(null);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>

      {/* Settings Dialog */}
      <DialogRoot open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Dialog>
          <DialogTitle>Settings</DialogTitle>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
              <ThemeSwitch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Profile</span>
              <div className="flex items-center space-x-2">
                {profile.avatar && <img src={profile.avatar} alt="Profile" className="w-6 h-6 rounded-full" />}
                <span className="text-sm text-gray-600 dark:text-gray-400">{profile.username || 'User'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <DialogButton type="secondary" onClick={() => setIsSettingsOpen(false)}>
              Close
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>

      {/* Control Panel Dialog */}
      <DialogRoot open={isControlPanelOpen} onOpenChange={setIsControlPanelOpen}>
        <Dialog>
          <DialogTitle>Control Panel</DialogTitle>
          <ControlPanel open={isControlPanelOpen} onClose={() => setIsControlPanelOpen(false)} />
          <div className="flex justify-end mt-4">
            <DialogButton type="secondary" onClick={() => setIsControlPanelOpen(false)}>
              Close
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
