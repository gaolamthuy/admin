import { UserAvatar } from '@/components/refine-ui/layout/user-avatar';
import { ThemeToggle } from '@/components/refine-ui/theme/theme-toggle';
import { NavUser } from '@/components/header-nav-user';
import { useAuthUser, useLogout } from '@/hooks/useAuth';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
          Admin Tool
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
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: user, isLoading } = useAuthUser();

  const handleSignOut = async () => {
    try {
      await logout.mutateAsync();
      toast.success('Đăng xuất thành công');
      navigate('/login');
    } catch {
      toast.error('Đăng xuất thất bại');
    }
  };

  if (isLoading || !user) {
    return <UserAvatar />;
  }

  return (
    <NavUser
      user={{
        name: user.name || user.email,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      }}
      onSignOut={handleSignOut}
    />
  );
};

Header.displayName = 'Header';
MobileHeader.displayName = 'MobileHeader';
DesktopHeader.displayName = 'DesktopHeader';
