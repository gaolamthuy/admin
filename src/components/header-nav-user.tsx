'use client';

import * as React from 'react';
import { LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  onSignOut?: () => void;
}

/**
 * NavUser Component
 * Header avatar với role display và signout functionality
 */
export function NavUser({ user, onSignOut }: NavUserProps) {
  const handleSignOut = () => {
    onSignOut?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            {user.role && (
              <Badge
                variant={user.role === 'admin' ? 'default' : 'secondary'}
                className="w-fit mt-1"
              >
                {user.role === 'admin'
                  ? 'Admin'
                  : user.role === 'staff'
                    ? 'Staff'
                    : user.role}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
