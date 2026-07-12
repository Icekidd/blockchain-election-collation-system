Γùç injected env (3) from .env // tip: Γùê secrets for agents [www.dotenvx.com]
// Sources flattened with hardhat v2.28.6 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/access/IAccessControl.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/IAccessControl.sol)

pragma solidity >=0.8.4;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}


// File @openzeppelin/contracts/utils/Context.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/utils/introspection/ERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File @openzeppelin/contracts/access/AccessControl.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.6.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;



/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @inheritdoc ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}


// File @openzeppelin/contracts/utils/Pausable.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File @openzeppelin/contracts/utils/StorageSlot.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.js.

pragma solidity ^0.8.20;

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * IMPORTANT: Deprecated. This storage-based reentrancy guard will be removed and replaced
 * by the {ReentrancyGuardTransient} variant in v6.0.
 *
 * @custom:stateless
 */
abstract contract ReentrancyGuard {
    using StorageSlot for bytes32;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @dev A `view` only version of {nonReentrant}. Use to block view functions
     * from being called, preventing reading from inconsistent contract state.
     *
     * CAUTION: This is a "view" modifier and does not change the reentrancy
     * status. Use it only on view functions. For payable or non-payable functions,
     * use the standard {nonReentrant} modifier instead.
     */
    modifier nonReentrantView() {
        _nonReentrantBeforeView();
        _;
    }

    function _nonReentrantBeforeView() private view {
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        _nonReentrantBeforeView();

        // Any calls to nonReentrant after this point will fail
        _reentrancyGuardStorageSlot().getUint256Slot().value = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _reentrancyGuardStorageSlot().getUint256Slot().value == ENTERED;
    }

    function _reentrancyGuardStorageSlot() internal pure virtual returns (bytes32) {
        return REENTRANCY_GUARD_STORAGE;
    }
}


// File contracts/interfaces/IElectionCollation.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

interface IElectionCollation {

    enum ElectionStatus { SETUP, ACTIVE, COLLATING, CLOSED }
    enum ResultStatus   { PENDING, CONFIRMED, FLAGGED, CORRECTED }

    struct PollingStationResult {
        string       stationId;
        string       stationName;
        string       constituency;
        string       district;
        string       region;
        uint256[]    votes;
        uint256      registeredVoters;
        uint256      accreditedVoters;
        uint256      rejectedBallots;
        string       ipfsHash;
        address      submittedBy;
        uint256      submittedAt;
        ResultStatus status;
    }

    struct Constituency {
        string  name;
        string  district;
        string  region;
        bool    locked;
        address lockedBy;
        uint256 lockedAt;
        uint256 totalStations;
        uint256 reportedStations;
    }

    struct CorrectionRequest {
        string    stationId;
        uint256[] correctedVotes;
        uint256   correctedRejected;
        string    correctedIpfsHash;
        string    reason;
        address   requestedBy;
        uint256   requestedAt;
        bool      roApproved;
        bool      seniorApproved;
        bool      executed;
    }

    struct Candidate {
        string name;
        string party;
        string color;
    }

    event ElectionStatusChanged(ElectionStatus indexed newStatus, uint256 timestamp);
    event ResultSubmitted(string indexed stationId, string indexed constituency, address indexed officer, string ipfsHash, uint256 timestamp);
    event ResultConfirmed(string indexed stationId, address indexed returningOfficer, uint256 timestamp);
    event ResultFlagged(string indexed stationId, address indexed flaggedBy, string reason, uint256 timestamp);
    event ConstituencyLocked(string indexed constituency, address indexed returningOfficer, uint256 totalVotes, uint256 timestamp);
    event CorrectionRequested(string indexed stationId, address indexed requestedBy, uint256 correctionId, uint256 timestamp);
    event CorrectionApproved(uint256 indexed correctionId, address indexed approvedBy, uint256 timestamp);
    event CorrectionExecuted(uint256 indexed correctionId, string indexed stationId, uint256 timestamp);
    event OfficerRegistered(address indexed wallet, bytes32 indexed role, string name, uint256 timestamp);
    event CandidateAdded(string name, string party, uint256 index, uint256 timestamp);
    event CandidateRemoved(uint256 index, uint256 timestamp);

    function submitResult(string calldata stationId, string calldata stationName, string calldata constituency, string calldata district, string calldata region, uint256[] calldata votes, uint256 registeredVoters, uint256 accreditedVoters, uint256 rejectedBallots, string calldata ipfsHash) external;
    function confirmResult(string calldata stationId) external;
    function flagResult(string calldata stationId, string calldata reason) external;
    function lockConstituency(string calldata constituency) external;
    function requestCorrection(string calldata stationId, uint256[] calldata correctedVotes, uint256 correctedRejected, string calldata correctedIpfsHash, string calldata reason) external;
    function approveCorrection(uint256 correctionId) external;
    function getResult(string calldata stationId) external view returns (PollingStationResult memory);
    function getConstituencyTotal(string calldata constituency) external view returns (uint256[] memory totals, uint256 grandTotal);
    function getConstituency(string calldata constituency) external view returns (Constituency memory);
    function getAllStationIds() external view returns (string[] memory);
    function getAllConstituencies() external view returns (string[] memory);
    function getCandidates() external view returns (Candidate[] memory);
    function getElectionStatus() external view returns (ElectionStatus);
    function getCorrection(uint256 id) external view returns (CorrectionRequest memory);
}


// File contracts/ElectionCollation.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;
contract ElectionCollation is IElectionCollation, AccessControl, Pausable, ReentrancyGuard {

    bytes32 public constant PRESIDING_OFFICER_ROLE = keccak256("PRESIDING_OFFICER_ROLE");
    bytes32 public constant RETURNING_OFFICER_ROLE  = keccak256("RETURNING_OFFICER_ROLE");
    bytes32 public constant SENIOR_EC_OFFICER_ROLE  = keccak256("SENIOR_EC_OFFICER_ROLE");

    string         public electionName;
    string         public electionDate;
    ElectionStatus public electionStatus;

    Candidate[] private _candidates;

    mapping(string => PollingStationResult) private _results;
    mapping(string => Constituency)         private _constituencies;
    mapping(uint256 => CorrectionRequest)   private _corrections;
    mapping(address => string)              private _officerNames;
    mapping(string => bool)                 private _constituencySeen;

    uint256   private _correctionCount;
    string[]  private _stationIds;
    string[]  private _constituencyNames;

    constructor(
        string   memory _electionName,
        string   memory _electionDate,
        string[] memory candidateNames,
        string[] memory partyNames,
        string[] memory partyColors
    ) {
        require(candidateNames.length == partyNames.length,  "Name/party mismatch");
        require(candidateNames.length == partyColors.length, "Name/color mismatch");
        require(bytes(_electionName).length > 0,             "Empty election name");
        require(bytes(_electionDate).length > 0,             "Empty election date");

        electionName   = _electionName;
        electionDate   = _electionDate;
        electionStatus = ElectionStatus.SETUP;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            _candidates.push(Candidate({ name: candidateNames[i], party: partyNames[i], color: partyColors[i] }));
        }

        _grantRole(DEFAULT_ADMIN_ROLE,     msg.sender);
        _grantRole(SENIOR_EC_OFFICER_ROLE, msg.sender);
        _grantRole(RETURNING_OFFICER_ROLE, msg.sender);
    }

    modifier onlyDuringCollation() {
        require(electionStatus == ElectionStatus.ACTIVE || electionStatus == ElectionStatus.COLLATING, "Collation not open");
        _;
    }

    modifier stationMustExist(string calldata stationId) {
        require(_results[stationId].submittedAt > 0, "Station not found");
        _;
    }

    modifier stationNotYetSubmitted(string calldata stationId) {
        require(_results[stationId].submittedAt == 0, "Already submitted");
        _;
    }

    modifier constituencyNotLocked(string calldata constituency) {
        require(!_constituencies[constituency].locked, "Constituency locked");
        _;
    }

    function setElectionStatus(ElectionStatus newStatus) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        electionStatus = newStatus;
        emit ElectionStatusChanged(newStatus, block.timestamp);
    }

    function addCandidate(
        string calldata name,
        string calldata party,
        string calldata color
    ) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        require(electionStatus == ElectionStatus.SETUP, "Can only add candidates during SETUP");
        require(bytes(name).length > 0,  "Empty name");
        require(bytes(party).length > 0, "Empty party");
        require(bytes(color).length > 0, "Empty color");

        // Prevent duplicate party
        for (uint256 i = 0; i < _candidates.length; i++) {
            require(
                keccak256(bytes(_candidates[i].party)) != keccak256(bytes(party)),
                "Party already has a candidate"
            );
        }

        _candidates.push(Candidate({ name: name, party: party, color: color }));
        emit CandidateAdded(name, party, _candidates.length - 1, block.timestamp);
    }

    function removeCandidate(uint256 index) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        require(electionStatus == ElectionStatus.SETUP, "Can only remove during SETUP");
        require(index < _candidates.length, "Invalid index");

        // Shift and pop to keep array compact
        for (uint256 i = index; i < _candidates.length - 1; i++) {
            _candidates[i] = _candidates[i + 1];
        }
        _candidates.pop();
        emit CandidateRemoved(index, block.timestamp);
    }   

    function pause()   external onlyRole(SENIOR_EC_OFFICER_ROLE) { _pause(); }
    function unpause() external onlyRole(SENIOR_EC_OFFICER_ROLE) { _unpause(); }

    function registerPresidingOfficer(address wallet, string calldata name) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        require(wallet != address(0), "Zero address");
        require(bytes(name).length > 0, "Empty name");
        _grantRole(PRESIDING_OFFICER_ROLE, wallet);
        _officerNames[wallet] = name;
        emit OfficerRegistered(wallet, PRESIDING_OFFICER_ROLE, name, block.timestamp);
    }

    function registerReturningOfficer(address wallet, string calldata name) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        require(wallet != address(0), "Zero address");
        require(bytes(name).length > 0, "Empty name");
        _grantRole(RETURNING_OFFICER_ROLE, wallet);
        _officerNames[wallet] = name;
        emit OfficerRegistered(wallet, RETURNING_OFFICER_ROLE, name, block.timestamp);
    }

    function revokePresidingOfficer(address wallet) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        _revokeRole(PRESIDING_OFFICER_ROLE, wallet);
    }

    function getOfficerName(address wallet) external view returns (string memory) {
        return _officerNames[wallet];
    }

    function submitResult(
        string   calldata stationId,
        string   calldata stationName,
        string   calldata constituency,
        string   calldata district,
        string   calldata region,
        uint256[] calldata votes,
        uint256  registeredVoters,
        uint256  accreditedVoters,
        uint256  rejectedBallots,
        string   calldata ipfsHash
    )
        external override whenNotPaused nonReentrant
        onlyRole(PRESIDING_OFFICER_ROLE)
        onlyDuringCollation
        stationNotYetSubmitted(stationId)
        constituencyNotLocked(constituency)
    {
        require(bytes(stationId).length > 0,       "Empty station ID");
        require(bytes(ipfsHash).length > 0,         "IPFS hash required");
        require(votes.length == _candidates.length, "Wrong candidate count");
        require(accreditedVoters <= registeredVoters, "Accredited > registered");

        uint256 totalVotes;
        for (uint256 i = 0; i < votes.length; i++) totalVotes += votes[i];
        require(totalVotes + rejectedBallots <= accreditedVoters, "Votes + rejected exceed accredited");

        _results[stationId] = PollingStationResult({
            stationId:        stationId,
            stationName:      stationName,
            constituency:     constituency,
            district:         district,
            region:           region,
            votes:            votes,
            registeredVoters: registeredVoters,
            accreditedVoters: accreditedVoters,
            rejectedBallots:  rejectedBallots,
            ipfsHash:         ipfsHash,
            submittedBy:      msg.sender,
            submittedAt:      block.timestamp,
            status:           ResultStatus.PENDING
        });

        _stationIds.push(stationId);

        if (!_constituencySeen[constituency]) {
            _constituencySeen[constituency] = true;
            _constituencyNames.push(constituency);
            _constituencies[constituency].name      = constituency;
            _constituencies[constituency].district  = district;
            _constituencies[constituency].region    = region;
        }
        _constituencies[constituency].reportedStations++;

        emit ResultSubmitted(stationId, constituency, msg.sender, ipfsHash, block.timestamp);
    }

    function confirmResult(string calldata stationId)
        external override whenNotPaused onlyRole(RETURNING_OFFICER_ROLE) stationMustExist(stationId)
    {
        require(_results[stationId].status == ResultStatus.PENDING, "Not in pending status");
        _results[stationId].status = ResultStatus.CONFIRMED;
        emit ResultConfirmed(stationId, msg.sender, block.timestamp);
    }

    function flagResult(string calldata stationId, string calldata reason)
        external override whenNotPaused onlyRole(RETURNING_OFFICER_ROLE) stationMustExist(stationId)
    {
        require(_results[stationId].status != ResultStatus.FLAGGED, "Already flagged");
        require(!_constituencies[_results[stationId].constituency].locked, "Constituency locked");
        require(bytes(reason).length > 0, "Reason required");
        _results[stationId].status = ResultStatus.FLAGGED;
        emit ResultFlagged(stationId, msg.sender, reason, block.timestamp);
    }

    function lockConstituency(string calldata constituency)
        external override whenNotPaused onlyRole(RETURNING_OFFICER_ROLE) constituencyNotLocked(constituency)
    {
        for (uint256 i = 0; i < _stationIds.length; i++) {
            PollingStationResult storage r = _results[_stationIds[i]];
            if (keccak256(bytes(r.constituency)) == keccak256(bytes(constituency)) && r.status == ResultStatus.FLAGGED) {
                revert("Resolve all flagged results first");
            }
        }
        (, uint256 grandTotal) = getConstituencyTotal(constituency);
        _constituencies[constituency].locked   = true;
        _constituencies[constituency].lockedBy = msg.sender;
        _constituencies[constituency].lockedAt = block.timestamp;
        emit ConstituencyLocked(constituency, msg.sender, grandTotal, block.timestamp);
    }

    function requestCorrection(
        string   calldata stationId,
        uint256[] calldata correctedVotes,
        uint256  correctedRejected,
        string   calldata correctedIpfsHash,
        string   calldata reason
    )
        external override whenNotPaused onlyRole(PRESIDING_OFFICER_ROLE) stationMustExist(stationId)
    {
        require(_results[stationId].status == ResultStatus.FLAGGED, "Not flagged");
        require(correctedVotes.length == _candidates.length,         "Wrong count");
        require(bytes(correctedIpfsHash).length > 0,                 "IPFS required");
        require(bytes(reason).length > 0,                            "Reason required");

        uint256 total;
        for (uint256 i = 0; i < correctedVotes.length; i++) total += correctedVotes[i];
        require(total + correctedRejected <= _results[stationId].accreditedVoters, "Corrected votes exceed accredited");

        uint256 id = _correctionCount++;
        _corrections[id] = CorrectionRequest({
            stationId:         stationId,
            correctedVotes:    correctedVotes,
            correctedRejected: correctedRejected,
            correctedIpfsHash: correctedIpfsHash,
            reason:            reason,
            requestedBy:       msg.sender,
            requestedAt:       block.timestamp,
            roApproved:        false,
            seniorApproved:    false,
            executed:          false
        });
        emit CorrectionRequested(stationId, msg.sender, id, block.timestamp);
    }

    function approveCorrection(uint256 correctionId) external override whenNotPaused {
        CorrectionRequest storage req = _corrections[correctionId];
        require(!req.executed,      "Already executed");
        require(req.requestedAt > 0,"Correction not found");

        if (hasRole(RETURNING_OFFICER_ROLE, msg.sender)) {
            require(!req.roApproved, "RO already approved");
            req.roApproved = true;
            emit CorrectionApproved(correctionId, msg.sender, block.timestamp);
        } else if (hasRole(SENIOR_EC_OFFICER_ROLE, msg.sender)) {
            require(!req.seniorApproved, "Senior already approved");
            req.seniorApproved = true;
            emit CorrectionApproved(correctionId, msg.sender, block.timestamp);
        } else {
            revert("Not authorised to approve");
        }

        if (req.roApproved && req.seniorApproved) {
            PollingStationResult storage r = _results[req.stationId];
            r.votes           = req.correctedVotes;
            r.rejectedBallots = req.correctedRejected;
            r.ipfsHash        = req.correctedIpfsHash;
            r.status          = ResultStatus.CORRECTED;
            req.executed      = true;
            emit CorrectionExecuted(correctionId, req.stationId, block.timestamp);
        }
    }

    function getResult(string calldata stationId) external view override returns (PollingStationResult memory) {
        return _results[stationId];
    }

    function getConstituencyTotal(string calldata constituency) public view override returns (uint256[] memory totals, uint256 grandTotal) {
        totals = new uint256[](_candidates.length);
        for (uint256 i = 0; i < _stationIds.length; i++) {
            PollingStationResult storage r = _results[_stationIds[i]];
            if (keccak256(bytes(r.constituency)) == keccak256(bytes(constituency)) &&
                (r.status == ResultStatus.CONFIRMED || r.status == ResultStatus.CORRECTED)) {
                for (uint256 j = 0; j < _candidates.length; j++) {
                    totals[j]  += r.votes[j];
                    grandTotal += r.votes[j];
                }
            }
        }
    }

    function getConstituency(string calldata c) external view override returns (Constituency memory) { return _constituencies[c]; }
    function getAllStationIds() external view override returns (string[] memory) { return _stationIds; }
    function getAllConstituencies() external view override returns (string[] memory) { return _constituencyNames; }
    function getCandidates() external view override returns (Candidate[] memory) { return _candidates; }
    function getElectionStatus() external view override returns (ElectionStatus) { return electionStatus; }
    function getCorrection(uint256 id) external view override returns (CorrectionRequest memory) { return _corrections[id]; }
    function candidateCount() external view returns (uint256) { return _candidates.length; }
    function totalStationsReported() external view returns (uint256) { return _stationIds.length; }
}
