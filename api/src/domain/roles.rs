use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Farmer,
    Admin,
    Superadmin,
}

impl Role {
    pub fn parse(value: &str) -> Option<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "farmer" | "agricultor" | "usuario" => Some(Self::Farmer),
            "admin" => Some(Self::Admin),
            "superadmin" => Some(Self::Superadmin),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Farmer => "farmer",
            Self::Admin => "admin",
            Self::Superadmin => "superadmin",
        }
    }

    pub fn is_admin(&self) -> bool {
        *self >= Self::Admin
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RoleChangeDenied {
    NotAdmin,
    SelfChange,
    TargetOutranksActor,
    GrantRequiresSuperadmin,
}

pub fn authorize_user_update(
    actor_id: i64,
    actor_role: Role,
    target_id: i64,
    target_role: Role,
    new_role: Option<Role>,
    new_active: Option<bool>,
) -> Result<(), RoleChangeDenied> {
    if !actor_role.is_admin() {
        return Err(RoleChangeDenied::NotAdmin);
    }
    let changes_role = new_role.is_some_and(|role| role != target_role);
    if actor_id == target_id && (changes_role || new_active == Some(false)) {
        return Err(RoleChangeDenied::SelfChange);
    }
    if actor_role == Role::Superadmin {
        return Ok(());
    }
    if target_role != Role::Farmer && actor_id != target_id {
        return Err(RoleChangeDenied::TargetOutranksActor);
    }
    if new_role.is_some_and(|role| role != Role::Farmer) {
        return Err(RoleChangeDenied::GrantRequiresSuperadmin);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_superadmin_grants_admin_roles() {
        assert_eq!(
            authorize_user_update(1, Role::Admin, 2, Role::Farmer, Some(Role::Admin), None),
            Err(RoleChangeDenied::GrantRequiresSuperadmin)
        );
        assert_eq!(
            authorize_user_update(
                1,
                Role::Superadmin,
                2,
                Role::Farmer,
                Some(Role::Admin),
                None
            ),
            Ok(())
        );
    }

    #[test]
    fn admins_manage_farmers_only_and_nobody_demotes_themselves() {
        assert_eq!(
            authorize_user_update(1, Role::Admin, 2, Role::Farmer, None, Some(false)),
            Ok(())
        );
        assert_eq!(
            authorize_user_update(1, Role::Admin, 3, Role::Superadmin, None, Some(false)),
            Err(RoleChangeDenied::TargetOutranksActor)
        );
        assert_eq!(
            authorize_user_update(
                1,
                Role::Superadmin,
                1,
                Role::Superadmin,
                Some(Role::Farmer),
                None
            ),
            Err(RoleChangeDenied::SelfChange)
        );
        assert_eq!(
            authorize_user_update(4, Role::Farmer, 2, Role::Farmer, None, Some(false)),
            Err(RoleChangeDenied::NotAdmin)
        );
    }

    #[test]
    fn legacy_role_names_map_to_farmer() {
        assert_eq!(Role::parse("agricultor"), Some(Role::Farmer));
        assert_eq!(Role::parse("usuario"), Some(Role::Farmer));
        assert_eq!(Role::parse("root"), None);
    }
}
