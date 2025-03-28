import React from 'react';
import { ACTIVITY_TYPES } from '@/constants';
import { shortenAddress, calculateTimeAgo } from '@/lib/utils';

/**
 * ActivityList Component - Displays a list of user activities
 * @param {Object} props - Component props
 * @param {Array} props.activities - Array of activity objects to display
 */
const ActivityList = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch(type) {
      case ACTIVITY_TYPES.UPLOAD:
        return { icon: 'upload_file', color: 'text-primary-500' };
      case ACTIVITY_TYPES.GRANT_ACCESS:
        return { icon: 'how_to_reg', color: 'text-secondary-500' };
      case ACTIVITY_TYPES.REVOKE_ACCESS:
        return { icon: 'no_accounts', color: 'text-error-500' };
      case ACTIVITY_TYPES.VIEW_RECORD:
        return { icon: 'visibility', color: 'text-accent-500' };
      default:
        return { icon: 'info', color: 'text-neutral-500' };
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-md">
      <ul className="divide-y divide-neutral-200">
        {activities.map((activity) => {
          const { icon, color } = getActivityIcon(activity.type);
          
          return (
            <li key={activity.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`material-icons ${color} mr-2`}>{icon}</span>
                    <p className="text-sm font-medium text-primary-600 truncate">{activity.title}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${activity.statusColor}-100 text-${activity.statusColor}-800`}>
                      {activity.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    {activity.metadata.hash && (
                      <p className="flex items-center text-sm text-neutral-500">
                        <span className="material-icons text-neutral-400 mr-1 text-sm">vpn_key</span>
                        IPFS Hash: <span className="font-mono ml-1 text-xs">{shortenAddress(activity.metadata.hash, 4)}</span>
                      </p>
                    )}
                    {activity.metadata.address && (
                      <p className="flex items-center text-sm text-neutral-500 mt-2 sm:mt-0 sm:ml-6">
                        <span className="material-icons text-neutral-400 mr-1 text-sm">
                          {activity.metadata.addressType === 'doctor' ? 'person' : 'domain'}
                        </span>
                        {activity.metadata.addressType === 'doctor' ? 'Doctor' : 'Hospital'} Address:
                        <span className="font-mono ml-1 text-xs">{shortenAddress(activity.metadata.address, 4)}</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0">
                    <span className="material-icons text-neutral-400 mr-1 text-sm">schedule</span>
                    <p>{calculateTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ActivityList;