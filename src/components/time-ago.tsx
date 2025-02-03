'use client';
import ReactTimeAgo from 'react-timeago';

interface TimeAgoProps {
  date: string;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ date }) => {
  const parsedDate = new Date(date);
  return <ReactTimeAgo date={parsedDate} />;
};

export default TimeAgo;