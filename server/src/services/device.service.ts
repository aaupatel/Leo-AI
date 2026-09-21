import {
  findDeviceById,
  findDevicesByUserId,
  createDevice,
  updateDevice,
  deleteDevice,
  deleteDevicesByUserId,
} from '../repositories/devices.repository';
import type { Device } from '../repositories/types';

export async function listDevices(userId: string): Promise<Device[]> {
  return findDevicesByUserId(userId);
}

export async function getDevice(userId: string, id: string): Promise<Device | null> {
  const device = await findDeviceById(id);
  if (!device || device.userId !== userId) {
    return null;
  }
  return device;
}

export async function createDeviceService(
  userId: string,
  name: string,
  platform: 'windows' | 'android' | 'web',
  deviceToken: string | null = null,
): Promise<Device> {
  return createDevice(userId, name, platform, deviceToken);
}

export async function updateDeviceService(
  userId: string,
  id: string,
  updates: Partial<Pick<Device, 'name' | 'platform' | 'deviceToken' | 'lastSeenAt'>>,
): Promise<Device | null> {
  const device = await findDeviceById(id);
  if (!device || device.userId !== userId) {
    return null;
  }
  return updateDevice(id, updates);
}

export async function updateDeviceToken(
  userId: string,
  id: string,
  deviceToken: string | null,
): Promise<Device | null> {
  const device = await findDeviceById(id);
  if (!device || device.userId !== userId) {
    return null;
  }
  return updateDevice(id, { deviceToken });
}

export async function updateDeviceLastSeen(
  userId: string,
  id: string,
  lastSeenAt: Date = new Date(),
): Promise<Device | null> {
  const device = await findDeviceById(id);
  if (!device || device.userId !== userId) {
    return null;
  }
  return updateDevice(id, { lastSeenAt });
}

export async function deleteDeviceService(userId: string, id: string): Promise<boolean> {
  const device = await findDeviceById(id);
  if (!device || device.userId !== userId) {
    return false;
  }
  return deleteDevice(id);
}

export async function deleteAllDevicesByUserId(userId: string): Promise<number> {
  return deleteDevicesByUserId(userId);
}
