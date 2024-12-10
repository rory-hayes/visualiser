'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

interface CardComponent
  extends React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> {
  Body: typeof CardBody;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
        {...props}
    />
)) as CardComponent;

const CardBody = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
));

Card.displayName = 'Card';
CardBody.displayName = 'CardBody';
Card.Body = CardBody;

export { Card };