/**
 * OrderTimeline Component
 * Visual representation of order status progression
 * Reusable across all dashboards
 */

import { Check, Clock, Package, Truck, Home } from 'lucide-react';
import { OrderStatus } from '@/types/orders';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  createdAt?: string;
  confirmedAt?: string;
  pickedAt?: string;
  deliveredAt?: string;
  compact?: boolean; // Show inline vs full width
}

// Map status to timeline position
const STATUS_TIMELINE = [
  { status: 'pending' as OrderStatus, label: 'Pending', icon: Clock, color: 'bg-gray-200' },
  { status: 'confirmed' as OrderStatus, label: 'Confirmed', icon: Check, color: 'bg-blue-200' },
  { status: 'picking' as OrderStatus, label: 'Picking', icon: Package, color: 'bg-yellow-200' },
  { status: 'picked' as OrderStatus, label: 'Picked', icon: Package, color: 'bg-yellow-400' },
  { status: 'in_transit' as OrderStatus, label: 'In Transit', icon: Truck, color: 'bg-orange-200' },
  { status: 'delivered' as OrderStatus, label: 'Delivered', icon: Home, color: 'bg-green-200' },
  { status: 'cancelled' as OrderStatus, label: 'Cancelled', icon: Clock, color: 'bg-red-200' },
];

/**
 * Get the position index of a status
 */
function getStatusIndex(status: OrderStatus): number {
  return STATUS_TIMELINE.findIndex(s => s.status === status);
}

export function OrderTimeline({
  currentStatus,
  createdAt,
  confirmedAt,
  pickedAt,
  deliveredAt,
  compact = false
}: OrderTimelineProps) {
  const currentIndex = getStatusIndex(currentStatus);

  // Filter timeline based on current status
  // Cancelled orders show only up to current point
  const filteredTimeline = currentStatus === 'cancelled'
    ? STATUS_TIMELINE.slice(0, currentIndex + 1)
    : STATUS_TIMELINE.slice(0, -1); // Exclude cancelled

  if (compact) {
    // Inline compact view
    return (
      <div className="flex items-center gap-2">
        {filteredTimeline.map((item, idx) => {
          const Icon = item.icon;
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={item.status} className="flex items-center">
              <div
                className={`p-1.5 rounded-full ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {idx < filteredTimeline.length - 1 && (
                <div
                  className={`w-4 h-0.5 mx-1 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
        <span className="text-sm font-medium ml-2">{currentStatus}</span>
      </div>
    );
  }

  // Full width timeline
  return (
    <div className="w-full">
      <div className="space-y-4">
        {filteredTimeline.map((item, idx) => {
          const Icon = item.icon;
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          // Get timestamp for this status
          let timestamp = '';
          if (item.status === 'confirmed') timestamp = confirmedAt || '';
          if (item.status === 'picked') timestamp = pickedAt || '';
          if (item.status === 'delivered') timestamp = deliveredAt || '';
          if (item.status === 'pending') timestamp = createdAt || '';

          return (
            <div key={item.status} className="flex gap-4">
              {/* Timeline marker */}
              <div className="flex flex-col items-center">
                <div
                  className={`p-2.5 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500'
                      : isCurrent
                      ? 'bg-primary border-primary animate-pulse'
                      : 'bg-muted border-muted'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isCompleted || isCurrent
                        ? 'text-white'
                        : 'text-muted-foreground'
                    }`}
                  />
                </div>

                {/* Connecting line */}
                {idx < filteredTimeline.length - 1 && (
                  <div
                    className={`w-0.5 h-12 my-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>

              {/* Status details */}
              <div className="flex-1 pt-2.5">
                <div className="flex items-baseline gap-2">
                  <h4 className={`font-semibold ${
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </h4>
                  {timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current status
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderTimeline;
