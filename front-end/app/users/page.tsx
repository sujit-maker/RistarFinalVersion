import React from 'react';
import SidebarWithHeader from '../components/Sidebar';
import UsersTable from './usersTable';

const UsersPage: React.FC = () => {
  return (
    <SidebarWithHeader>
      <UsersTable/>
    </SidebarWithHeader>
  );
};

export default UsersPage