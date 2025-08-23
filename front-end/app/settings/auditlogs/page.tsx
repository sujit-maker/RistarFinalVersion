import React from 'react';;
import SidebarWithHeader from '../../components/Sidebar';
import AuditLogsPage from './AuditLogs';

export default function Customers() {
  return (
    <SidebarWithHeader>
      <AuditLogsPage />
    </SidebarWithHeader>
  );
}