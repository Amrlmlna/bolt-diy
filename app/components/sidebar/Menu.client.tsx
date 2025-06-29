import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import { SettingsButton } from '~/components/ui/SettingsButton';
import { Button } from '~/components/ui/Button';
import { chatId, type ChatHistoryItem } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';
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

type DialogContent =
  | { type: 'delete'; item: ChatHistoryItem }
  | { type: 'bulkDelete'; items: ChatHistoryItem[] }
  | null;

function CurrentDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800/50 font-montserrat">
      <div className="h-4 w-4 i-ph:clock opacity-80" />
      <div className="flex gap-2">
        <span>{dateTime.toLocaleDateString()}</span>
        <span>{dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

export function Menu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useStore(profileStore);

  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

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
      setOpen(false);
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
        setOpen(false);

        toast.success('Chat duplicated successfully');
      } catch (error) {
        console.error('Failed to duplicate chat:', error);
        toast.error('Failed to duplicate chat');
      }
    },
    [navigate],
  );

  const closeDialog = () => {
    setDialogContent(null);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);

    if (selectionMode) {
      // If turning selection mode OFF, clear selection
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSelectedItems = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id];
      console.log('Selected items updated:', newSelectedItems);
      return newSelectedItems;
    });
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.info('Select at least one chat to delete');
      return;
    }

    const selectedChats = list.filter((item) => selectedItems.includes(item.id));

    if (selectedChats.length === 0) {
      toast.error('Could not find selected chats');
      return;
    }

    setDialogContent({ type: 'bulkDelete', items: selectedChats });
  }, [selectedItems, list]);

  const selectAll = useCallback(() => {
    const allFilteredIds = filteredList.map((item) => item.id);
    setSelectedItems((prev) => {
      const allFilteredAreSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => prev.includes(id));

      if (allFilteredAreSelected) {
        // Deselect only the filtered items
        const newSelectedItems = prev.filter((id) => !allFilteredIds.includes(id));
        console.log('Deselecting all filtered items. New selection:', newSelectedItems);
        return newSelectedItems;
      } else {
        // Select all filtered items, adding them to any existing selections
        const newSelectedItems = [...new Set([...prev, ...allFilteredIds])];
        console.log('Selecting all filtered items. New selection:', newSelectedItems);
        return newSelectedItems;
      }
    });
  }, [filteredList]);

  const deleteSelectedItems = useCallback(
    async (itemsToDeleteIds: string[]) => {
      if (itemsToDeleteIds.length === 0) {
        console.log('Bulk delete skipped: No items to delete.');
        return;
      }

      console.log(`Starting bulk delete for ${itemsToDeleteIds.length} chats`, itemsToDeleteIds);

      let deletedCount = 0;
      const errors: string[] = [];
      const currentChatId = chatId.get();
      let shouldNavigate = false;

      // Process deletions sequentially
      for (const id of itemsToDeleteIds) {
        try {
          await handleDelete(id);
          deletedCount++;

          if (id === currentChatId) {
            shouldNavigate = true;
          }
        } catch (error) {
          console.error(`Error deleting chat ${id}:`, error);
          errors.push(id);
        }
      }

      // Show appropriate toast message
      if (errors.length === 0) {
        toast.success(`${deletedCount} chat${deletedCount === 1 ? '' : 's'} deleted successfully`);
      } else {
        toast.warning(`Deleted ${deletedCount} of ${itemsToDeleteIds.length} chats. ${errors.length} failed.`, {
          autoClose: 5000,
        });
      }

      // Reload the list after all deletions
      await loadChats();

      // Clear selection state
      setSelectedItems([]);
      setSelectionMode(false);

      // Navigate if needed
      if (shouldNavigate) {
        console.log('Navigating away from deleted chat');
        navigate('/');
      }
    },
    [handleDelete, loadChats, navigate],
  );

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setOpen(false);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  // Load entries when menu opens
  useEffect(() => {
    if (open) {
      loadChats();
    }
  }, [open, loadChats]);

  // Exit selection mode when sidebar is closed
  useEffect(() => {
    if (!open && selectionMode) {
      console.log('Sidebar closed, preserving selection state');
    }
  }, [open, selectionMode]);

  // Mouse-based menu activation (original bolt-diy logic)
  useEffect(() => {
    const enterThreshold = 20;
    const exitThreshold = 20;

    function onMouseMove(event: MouseEvent) {
      if (isSettingsOpen) {
        return;
      }

      if (event.pageX < enterThreshold) {
        setOpen(true);
      }

      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) {
        setOpen(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isSettingsOpen]);

  const groupedItems = binDates(filteredList);

  return (
    <>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        style={{ width: '340px' }}
        className={classNames(
          'flex selection-accent flex-col side-menu fixed top-0 h-full rounded-r-2xl',
          'bg-white dark:bg-gray-950 border-r border-bolt-elements-borderColor',
          'shadow-sm text-sm',
          isSettingsOpen ? 'z-40' : 'z-sidebar',
        )}
      >
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 rounded-tr-2xl">
          <div className="text-gray-900 dark:text-white font-medium"></div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm text-gray-900 dark:text-white truncate font-montserrat">
              {profile?.username || 'Guest User'}
            </span>
            <div className="flex items-center justify-center w-[32px] h-[32px] overflow-hidden bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-500 rounded-full shrink-0">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile?.username || 'User'}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                />
              ) : (
                <div className="i-ph:user-fill text-lg" />
              )}
            </div>
          </div>
        </div>
        <CurrentDateTime />
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <a
                href="/"
                className="flex-1 flex gap-2 items-center bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg px-4 py-2 transition-colors font-montserrat"
              >
                <span className="inline-block i-ph:plus-circle h-4 w-4" />
                <span className="text-sm font-medium">Start new chat</span>
              </a>
              <button
                onClick={toggleSelectionMode}
                className={classNames(
                  'flex gap-1 items-center rounded-lg px-3 py-2 transition-colors font-montserrat',
                  selectionMode
                    ? 'bg-primary-600 dark:bg-primary-500 text-white border border-primary-700 dark:border-primary-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700',
                )}
                aria-label={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
              >
                <span className={selectionMode ? 'i-ph:x h-4 w-4' : 'i-ph:check-square h-4 w-4'} />
              </button>
            </div>
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <span className="i-ph:magnifying-glass h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                className="w-full bg-gray-50 dark:bg-gray-900 relative pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-800 font-montserrat"
                type="search"
                placeholder="Search chats..."
                onChange={handleSearchChange}
                aria-label="Search chats"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm px-4 py-2">
            <div className="font-medium text-gray-600 dark:text-gray-400 font-montserrat">Your Chats</div>
            {selectionMode && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll} className="font-montserrat">
                  {selectedItems.length === filteredList.length ? 'Deselect all' : 'Select all'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  disabled={selectedItems.length === 0}
                  className="font-montserrat"
                >
                  Delete selected
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto px-3 pb-3">
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

            {!error && filteredList.length === 0 && !isLoading && (
              <div className="px-4 text-gray-500 dark:text-gray-400 text-sm">
                {list.length === 0 ? 'No previous conversations' : 'No matches found'}
              </div>
            )}

            {!error && (
              <DialogRoot open={dialogContent !== null}>
                {groupedItems.map(({ category, items }) => (
                  <div key={category} className="mt-2 first:mt-0 space-y-1">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0 z-1 bg-white dark:bg-gray-950 px-4 py-1">
                      {category}
                    </div>
                    <div className="space-y-0.5 pr-1">
                      {items.map((item) => (
                        <HistoryItem
                          key={item.id}
                          item={item}
                          onDelete={() => handleDeleteClick(item)}
                          onDuplicate={() => handleDuplicate(item)}
                          exportChat={() => {}}
                          selectionMode={selectionMode}
                          isSelected={selectedItems.includes(item.id)}
                          onToggleSelection={toggleItemSelection}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
                  {dialogContent?.type === 'delete' && (
                    <>
                      <div className="p-6 bg-white dark:bg-gray-950">
                        <DialogTitle className="text-gray-900 dark:text-white font-poppins">Delete Chat?</DialogTitle>
                        <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400 font-montserrat">
                          <p>
                            You are about to delete{' '}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {dialogContent.item.description}
                            </span>
                          </p>
                          <p className="mt-2">Are you sure you want to delete this chat?</p>
                        </DialogDescription>
                      </div>
                      <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        <DialogButton type="secondary" onClick={closeDialog}>
                          Cancel
                        </DialogButton>
                        <DialogButton
                          type="danger"
                          onClick={() => {
                            handleDelete(dialogContent.item.id);
                            closeDialog();
                          }}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </DialogButton>
                      </div>
                    </>
                  )}
                  {dialogContent?.type === 'bulkDelete' && (
                    <>
                      <div className="p-6 bg-white dark:bg-gray-950">
                        <DialogTitle className="text-gray-900 dark:text-white font-poppins">
                          Delete Selected Chats?
                        </DialogTitle>
                        <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400 font-montserrat">
                          <p>
                            You are about to delete {dialogContent.items.length}{' '}
                            {dialogContent.items.length === 1 ? 'chat' : 'chats'}:
                          </p>
                          <div className="mt-2 max-h-32 overflow-auto border border-gray-100 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900 p-2">
                            <ul className="list-disc pl-5 space-y-1">
                              {dialogContent.items.map((item) => (
                                <li key={item.id} className="text-sm font-montserrat">
                                  <span className="font-medium text-gray-900 dark:text-white">{item.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className="mt-3">Are you sure you want to delete these chats?</p>
                        </DialogDescription>
                      </div>
                      <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        <DialogButton type="secondary" onClick={closeDialog}>
                          Cancel
                        </DialogButton>
                        <DialogButton
                          type="danger"
                          onClick={() => {
                            const itemsToDeleteNow = [...selectedItems];
                            console.log(
                              'Bulk delete confirmed for',
                              itemsToDeleteNow.length,
                              'items',
                              itemsToDeleteNow,
                            );
                            deleteSelectedItems(itemsToDeleteNow);
                            closeDialog();
                          }}
                        >
                          Delete
                        </DialogButton>
                      </div>
                    </>
                  )}
                </Dialog>
              </DialogRoot>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
            <SettingsButton onClick={handleSettingsClick} />
            <ThemeSwitch />
          </div>
        </div>
      </motion.div>

      {/* Settings Dialog */}
      <DialogRoot open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Dialog>
          <DialogTitle className="font-poppins">Settings</DialogTitle>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-montserrat">Dark Mode</span>
              <ThemeSwitch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-montserrat">Profile</span>
              <div className="flex items-center space-x-2">
                {profile.avatar && <img src={profile.avatar} alt="Profile" className="w-6 h-6 rounded-full" />}
                <span className="text-sm text-gray-600 dark:text-gray-400 font-montserrat">
                  {profile.username || 'User'}
                </span>
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
      <DialogRoot open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Dialog>
          <DialogTitle className="font-poppins">Control Panel</DialogTitle>
          <ControlPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          <div className="flex justify-end mt-4">
            <DialogButton type="secondary" onClick={() => setIsSettingsOpen(false)}>
              Close
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
