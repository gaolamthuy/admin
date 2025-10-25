import { UserAvatar } from '@/components/refine-ui/layout/user-avatar';
import { ThemeToggle } from '@/components/refine-ui/theme/theme-toggle';
import { NavUser } from '@/components/header-nav-user';
import { useAuthUser } from '@/hooks/useAuthUser';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {
  useActiveAuthProvider,
  useLogout,
  useRefineOptions,
} from '@refinedev/core';

export const Header = () => {
  const { isMobile } = useSidebar();

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  return (
    <header
      className={cn(
        'sticky',
        'top-0',
        'flex',
        'h-16',
        'shrink-0',
        'items-center',
        'gap-4',
        'border-b',
        'border-border',
        'bg-sidebar',
        'pr-3',
        'justify-end',
        'z-40'
      )}
    >
      <ThemeToggle />
      <UserDropdown />
    </header>
  );
}

function MobileHeader() {
  const { open, isMobile } = useSidebar();

  const { title } = useRefineOptions();

  return (
    <header
      className={cn(
        'sticky',
        'top-0',
        'flex',
        'h-12',
        'shrink-0',
        'items-center',
        'gap-2',
        'border-b',
        'border-border',
        'bg-sidebar',
        'pr-3',
        'justify-between',
        'z-40'
      )}
    >
      <SidebarTrigger
        className={cn('text-muted-foreground', 'rotate-180', 'ml-1', {
          'opacity-0': open,
          'opacity-100': !open || isMobile,
          'pointer-events-auto': !open || isMobile,
          'pointer-events-none': open && !isMobile,
        })}
      />

      <div
        className={cn(
          'whitespace-nowrap',
          'flex',
          'flex-row',
          'h-full',
          'items-center',
          'justify-start',
          'gap-2',
          'transition-discrete',
          'duration-200',
          {
            'pl-3': !open,
            'pl-5': open,
          }
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            'text-sm',
            'font-bold',
            'transition-opacity',
            'duration-200',
            {
              'opacity-0': !open,
              'opacity-100': open,
            }
          )}
        >
          {title.text}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle className={cn('h-8', 'w-8')} />
        <UserDropdown />
      </div>
    </header>
  );
}

const UserDropdown = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { user, signOut } = useAuthUser();

  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity || !user) {
    return <UserAvatar />;
  }

  const handleSignOut = () => {
    signOut();
    logout();
  };

  return <NavUser user={user} onSignOut={handleSignOut} />;
};

Header.displayName = 'Header';
MobileHeader.displayName = 'MobileHeader';
DesktopHeader.displayName = 'DesktopHeader';
