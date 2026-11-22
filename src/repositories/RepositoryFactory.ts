import { isFirebaseConfigured } from "@/config/firebaseConfig";
import { FirebaseRepository } from "@/repositories/FirebaseRepository";
import { LocalStorageRepository } from "@/repositories/LocalStorageRepository";
import type { GastroRepository } from "@/repositories/RepositoryInterface";

export function createRepository(): GastroRepository {
  if (isFirebaseConfigured()) return new FirebaseRepository();
  return new LocalStorageRepository();
}
