import { memo } from 'react';
import { IconButton } from '~/components/ui/IconButton';
interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = memo(({ onClick }: SettingsButtonProps) => {
  return (
    <IconButton
      onClick={onClick}
      icon="i-ph:gear"
      size="xl"
      title="Settings"
      data-testid="settings-button"
      className="text-[#666] hover:text-bit-elements-textPrimary hover:bg-bit-elements-item-backgroundActive/10 transition-colors"
    />
  );
});
