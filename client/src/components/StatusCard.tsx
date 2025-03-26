import React from 'react';

interface StatusCardProps {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string | number;
  valueColor?: string;
  actionText: string;
  actionUrl: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  icon,
  iconBgColor,
  iconColor,
  title,
  value,
  valueColor = "text-neutral-900",
  actionText,
  actionUrl
}) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <span className={`material-icons ${iconColor}`}>{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
              <dd>
                <div className={`text-lg font-medium ${valueColor}`}>{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-neutral-50 px-5 py-3">
        <div className="text-sm">
          <a href={actionUrl} className="font-medium text-primary-600 hover:text-primary-700">
            {actionText}
          </a>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
