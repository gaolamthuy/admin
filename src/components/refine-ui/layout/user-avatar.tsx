import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuthUser } from '@/hooks/useAuth';

export function UserAvatar() {
  const { data: user, isLoading: userIsLoading } = useAuthUser();

  if (userIsLoading || !user) {
    return <Skeleton className={cn('h-10', 'w-10', 'rounded-full')} />;
  }

  const fullName = user.name || user.email || 'User';
  const avatar = user.avatar;

  return (
    <Avatar className={cn('h-10', 'w-10')}>
      {avatar && <AvatarImage src={avatar} alt={fullName} />}
      <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
    </Avatar>
  );
}

const getInitials = (name = '') => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();

  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

UserAvatar.displayName = 'UserAvatar';
