import intersection from "lodash/intersection"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import ProfileSettingsModel from "../model"
import {
  ProfileSettingsAttributes,
  updateProfileSettingsSchema,
} from "../types"
import isEthereumAddress from "validator/lib/isEthereumAddress"
import { canEditAnyProfile } from "../utils"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { getMyProfileSettings } from "./getMyProfileSettings"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"

export const validateProfileSettings =
  createValidator<ProfileSettingsAttributes>(updateProfileSettingsSchema)

export async function updateProfileSettings(req: WithAuth) {
  const currentUserProfile = await getMyProfileSettings(req)
  if (!isAdmin(req.auth) && !canEditAnyProfile(currentUserProfile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  const user = req.params.profile_id.toLowerCase()
  if (isEthereumAddress(user)) {
    throw new RequestError(`Not found "${user}" profile`, RequestError.NotFound)
  }

  const profile = ProfileSettingsModel.findOne({ user })
  if (!profile) {
    throw new RequestError(`Not found "${user}" profile`, RequestError.NotFound)
  }

  const updateAttributes = validateProfileSettings(req.body)
  const newProfile: ProfileSettingsAttributes = {
    ...profile,
    ...updateAttributes,
  }

  // grant only permissions that the current user have
  newProfile.permissions = intersection(
    currentUserProfile.permissions,
    newProfile.permissions
  )
  await ProfileSettingsModel.update(newProfile, { user })
  return newProfile
}
