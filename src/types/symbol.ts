import {
  Activity,
  Bed,
  Bell,
  Droplets,
  Flame,
  HeartHandshake,
  Pill,
  Phone,
  Snowflake,
  Tv,
  UtensilsCrossed,
  HandHeart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Urgency } from './model';

export interface SymbolTile {
  id: string;
  label: string;
  icon: LucideIcon;
  impliedPhrase: string;
  urgencyHint: Urgency;
}

export const SYMBOL_BOARD: SymbolTile[] = [
  {
    id: 'pain',
    label: 'Pain',
    icon: Activity,
    impliedPhrase: 'I am in pain.',
    urgencyHint: 'HIGH',
  },
  {
    id: 'water',
    label: 'Water',
    icon: Droplets,
    impliedPhrase: 'I would like some water.',
    urgencyHint: 'LOW',
  },
  {
    id: 'food',
    label: 'Food',
    icon: UtensilsCrossed,
    impliedPhrase: 'I am hungry.',
    urgencyHint: 'LOW',
  },
  {
    id: 'toilet',
    label: 'Toilet',
    icon: Bell,
    impliedPhrase: 'I need to use the bathroom.',
    urgencyHint: 'NORMAL',
  },
  {
    id: 'cold',
    label: 'Cold',
    icon: Snowflake,
    impliedPhrase: 'I feel cold.',
    urgencyHint: 'LOW',
  },
  {
    id: 'hot',
    label: 'Hot',
    icon: Flame,
    impliedPhrase: 'I feel hot.',
    urgencyHint: 'LOW',
  },
  {
    id: 'call-family',
    label: 'Call Family',
    icon: Phone,
    impliedPhrase: 'Please call my family.',
    urgencyHint: 'NORMAL',
  },
  {
    id: 'medicine',
    label: 'Medicine',
    icon: Pill,
    impliedPhrase: 'I need my medication.',
    urgencyHint: 'NORMAL',
  },
  {
    id: 'help',
    label: 'Help',
    icon: HandHeart,
    impliedPhrase: 'I need help.',
    urgencyHint: 'HIGH',
  },
  {
    id: 'tv',
    label: 'TV',
    icon: Tv,
    impliedPhrase: 'Please turn on the television.',
    urgencyHint: 'LOW',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: Bed,
    impliedPhrase: 'I want to rest.',
    urgencyHint: 'LOW',
  },
  {
    id: 'thanks',
    label: 'Thank You',
    icon: HeartHandshake,
    impliedPhrase: 'Thank you.',
    urgencyHint: 'LOW',
  },
];
