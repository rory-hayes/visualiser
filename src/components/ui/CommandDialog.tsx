'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog, DialogContent } from './Dialog';
import { cn } from '@/utils/cn';

const CommandDialog = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<typeof Dialog> & {
        onKeyDown?: (event: React.KeyboardEvent) => void;
    }
>(({ children, onKeyDown, ...props }, ref) => (
    <Dialog {...props}>
        <DialogContent className="overflow-hidden p-0" ref={ref}>
            <CommandPrimitive
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500"
                onKeyDown={onKeyDown}
            >
                {children}
            </CommandPrimitive>
        </DialogContent>
    </Dialog>
));
CommandDialog.displayName = "CommandDialog";

export { CommandDialog }; 