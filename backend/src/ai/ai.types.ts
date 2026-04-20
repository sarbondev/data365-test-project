export interface ParsedIntent {
  action:
    | 'LOG_INCOME'
    | 'LOG_EXPENSE'
    | 'QUERY'
    | 'DELETE_LAST'
    | 'UNCLEAR';
  amount?: number;
  categoryGuess?: string;
  note?: string;
  date?: string;
  queryType?: 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';
  queryCategory?: string;
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
}
