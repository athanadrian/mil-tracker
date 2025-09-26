'use client';
import { Stat } from '@/components/common';
import { appIcons } from '@/constants/app-icons';
import { CountsType } from '@/actions/dashboard.actions';

const StatsContainer = ({ counts }: { counts: CountsType }) => {
  return (
    <div>
      <Stat
        //key={item.href}
        icon={appIcons.countries}
        label='Χώρες'
        value={counts?.countries}
        //href={item.href}
      />
    </div>
  );
};

export default StatsContainer;
