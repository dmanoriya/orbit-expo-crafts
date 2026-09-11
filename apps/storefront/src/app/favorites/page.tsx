import React from 'react';
import { AccountClientView } from '../account/AccountClientView';

export const metadata = {
  title: 'Saved Favourites & Specifications | Orbit Expo Crafts',
  description: 'View and manage your saved furniture and lighting specifications for commercial architecture and interior design projects.',
};

export default function FavoritesPage() {
  return <AccountClientView initialTab="favorites" />;
}
