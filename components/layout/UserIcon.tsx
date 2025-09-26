'use client';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';

const UserIcon = ({ imageUrl }: { imageUrl: string | null }) => {
  if (imageUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt='profile'
        className='w-6 h-6 rounded-full object-cover'
      />
    );
  return (
    <AppIcon
      icon={appIcons.user_user}
      size={22}
      className='bg-primary text-white rounded-full '
    />
  );
};

export default UserIcon;
