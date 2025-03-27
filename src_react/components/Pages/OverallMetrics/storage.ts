
import { makeStorage } from '../../util/StorageUtils';

const MetricStorage = makeStorage('metrics');

export const { get, set, clear, clearAll, makeChildStorage, useStorageState } = MetricStorage;
export default MetricStorage;