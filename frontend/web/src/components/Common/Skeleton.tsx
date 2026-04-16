import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '0.5rem',
  className = ''
}) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
  />
);

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton width="60px" height="60px" borderRadius="1rem" />
    <Skeleton width="70%" height="16px" />
    <Skeleton width="40%" height="12px" />
  </div>
);

export const SkeletonListItem = () => (
  <div className="skeleton-list-item">
    <Skeleton width="40px" height="40px" borderRadius="50%" />
    <div className="skeleton-list-content">
      <Skeleton width="60%" height="14px" />
      <Skeleton width="40%" height="10px" />
    </div>
  </div>
);

export const SkeletonStatCard = () => (
  <div className="skeleton-stat-card">
    <Skeleton width="32px" height="32px" borderRadius="8px" />
    <Skeleton width="40px" height="24px" />
    <Skeleton width="50px" height="10px" />
  </div>
);

export default Skeleton;
