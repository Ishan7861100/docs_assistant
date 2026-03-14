import { Request, Response } from 'express';
import { getSettingsByUser, saveUserSettings } from '../utils/dataStore';

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const settings = await getSettingsByUser(req.user.userId);
    // Mask API key in response
    const safeSettings = settings
      ? {
          ...settings,
          apiKey: settings.apiKey ? `${settings.apiKey.slice(0, 7)}...${settings.apiKey.slice(-4)}` : undefined,
          hasApiKey: !!settings.apiKey,
        }
      : { userId: req.user.userId, hasApiKey: false };
    res.json(safeSettings);
  } catch {
    res.status(500).json({ error: 'Failed to get settings' });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { apiKey, model, systemPrompt } = req.body;
    const updates: Record<string, unknown> = {};

    if (apiKey !== undefined) updates.apiKey = apiKey;
    if (model !== undefined) updates.model = model;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;

    await saveUserSettings(req.user.userId, updates);
    res.json({ message: 'Settings updated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

export async function resetSettings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await saveUserSettings(req.user.userId, {
      apiKey: undefined,
      model: undefined,
      systemPrompt: undefined,
    });
    res.json({ message: 'Settings reset successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to reset settings' });
  }
}
