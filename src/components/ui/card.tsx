import * as React from 'react';
import {cn} from '@/lib/utils';
export const Card=React.forwardRef<HTMLDivElement,React.HTMLAttributes<HTMLDivElement>>(({className,...p},ref)=><div ref={ref} className={cn('rounded-lg border bg-card text-card-foreground',className)} {...p}/>);
export const CardHeader=({className,...p}:React.HTMLAttributes<HTMLDivElement>)=><div className={cn('flex flex-col gap-1.5 p-6',className)} {...p}/>;
export const CardTitle=({className,...p}:React.HTMLAttributes<HTMLHeadingElement>)=><h2 className={cn('text-base font-semibold leading-none tracking-tight',className)} {...p}/>;
export const CardDescription=({className,...p}:React.HTMLAttributes<HTMLParagraphElement>)=><p className={cn('text-sm text-muted-foreground',className)} {...p}/>;
export const CardContent=({className,...p}:React.HTMLAttributes<HTMLDivElement>)=><div className={cn('p-6 pt-0',className)} {...p}/>;
export const CardFooter=({className,...p}:React.HTMLAttributes<HTMLDivElement>)=><div className={cn('flex items-center p-6 pt-0',className)} {...p}/>;
