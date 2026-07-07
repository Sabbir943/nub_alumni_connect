 // Checked spelling context for 'components'
import DashboardLayout from '@/component/DashboardLayout';
import React from 'react';

const BaseDashboardLayoutWrapper = ({ children }) => {
  return (
    // We pass children directly inside the dynamic role-based layout sidebar system
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

export default BaseDashboardLayoutWrapper;