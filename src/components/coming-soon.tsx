import { Construction, Clock, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: 'construction' | 'clock' | 'lightbulb';
  variant?: 'default' | 'minimal' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is currently under development and will be available soon.',
  icon = 'construction',
  variant = 'default',
  size = 'md',
  className = ''
}: ComingSoonProps) {
  const iconMap = {
    construction: Construction,
    clock: Clock,
    lightbulb: Lightbulb
  };

  const IconComponent = iconMap[icon];

  const sizeClasses = {
    sm: {
      container: 'p-6',
      icon: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm'
    },
    md: {
      container: 'p-8',
      icon: 'w-12 h-12',
      title: 'text-xl',
      description: 'text-base'
    },
    lg: {
      container: 'p-12',
      icon: 'w-16 h-16',
      title: 'text-2xl',
      description: 'text-lg'
    }
  };

  const currentSize = sizeClasses[size];

  if (variant === 'minimal') {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center ${currentSize.container} ${className}`}
      >
        <IconComponent className={`${currentSize.icon} text-gray-400 mb-3`} />
        <h3 className={`${currentSize.title} font-medium text-gray-600 mb-2`}>
          {title}
        </h3>
        <p className={`${currentSize.description} text-gray-500 max-w-md`}>
          {description}
        </p>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <IconComponent className={`${currentSize.icon} text-gray-400`} />
          </div>
          <CardTitle className={`${currentSize.title} text-gray-600`}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className={`${currentSize.description} text-gray-500`}>
            {description}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${currentSize.container} rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 ${className}`}
    >
      <Badge variant="secondary" className="text-xs mb-4">
        In Development
      </Badge>
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`${currentSize.title} font-semibold text-gray-700`}>
          {title}
        </h3>
      </div>
      <p className={`${currentSize.description} text-gray-500 max-w-md`}>
        {description}
      </p>
    </div>
  );
}
