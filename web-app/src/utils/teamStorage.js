// Team members utility - stores team members in localStorage for cross-component access
const TEAM_STORAGE_KEY = 'montty_zoom_team_members';

export const getTeamMembers = () => {
  try {
    const stored = localStorage.getItem(TEAM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Return default team members if none stored
    return [
      {
        id: 1,
        name: 'Alexandra Deff',
        email: 'alexandra@example.com',
        phone: '+1 234 567 8900',
        role: 'Developer',
        status: 'active',
        avatar: 'AD'
      },
      {
        id: 2,
        name: 'Edwin Adenike',
        email: 'edwin@example.com',
        phone: '+1 234 567 8901',
        role: 'Designer',
        status: 'active',
        avatar: 'EA'
      },
      {
        id: 3,
        name: 'Isaac Oluwatemilorun',
        email: 'isaac@example.com',
        phone: '+1 234 567 8902',
        role: 'Manager',
        status: 'active',
        avatar: 'IO'
      },
      {
        id: 4,
        name: 'David Oshodi',
        email: 'david@example.com',
        phone: '+1 234 567 8903',
        role: 'Developer',
        status: 'active',
        avatar: 'DO'
      }
    ];
  } catch (error) {
    console.error('Error loading team members:', error);
    return [];
  }
};

export const saveTeamMembers = (members) => {
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
  } catch (error) {
    console.error('Error saving team members:', error);
  }
};

export const addTeamMember = (member) => {
  const members = getTeamMembers();
  const newMember = {
    id: members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1,
    ...member,
    status: member.status || 'active',
    avatar: member.avatar || member.name.split(' ').map(n => n[0]).join('').toUpperCase()
  };
  const updatedMembers = [...members, newMember];
  saveTeamMembers(updatedMembers);
  return updatedMembers;
};

export const updateTeamMember = (id, updates) => {
  const members = getTeamMembers();
  const updatedMembers = members.map(m => 
    m.id === id ? { ...m, ...updates } : m
  );
  saveTeamMembers(updatedMembers);
  return updatedMembers;
};

export const deleteTeamMember = (id) => {
  const members = getTeamMembers();
  const updatedMembers = members.filter(m => m.id !== id);
  saveTeamMembers(updatedMembers);
  return updatedMembers;
};

