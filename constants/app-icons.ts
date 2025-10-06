import { AiOutlineClose } from 'react-icons/ai';
import { FaSitemap, FaTools, FaList } from 'react-icons/fa';
import { FaPersonMilitaryRifle } from 'react-icons/fa6';
import {
  MdFireplace,
  MdDashboard,
  MdOutlineKeyboardDoubleArrowLeft,
  MdOutlineKeyboardDoubleArrowRight,
  MdLockReset,
  MdWbSunny,
} from 'react-icons/md';
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiSettings,
  FiDatabase,
} from 'react-icons/fi';
import { RiUser2Line, RiUserSettingsLine, RiAdminLine } from 'react-icons/ri';
import {
  LuCommand,
  LuChevronDown,
  LuArrowUpDown,
  LuUpload,
} from 'react-icons/lu';
import { IoMdPaper } from 'react-icons/io';
import { CgUserList } from 'react-icons/cg';
import { IoAdd, IoDownloadSharp } from 'react-icons/io5';
import {
  PiFlagLight,
  PiGitBranchBold,
  PiTrashThin,
  PiCreditCardLight,
} from 'react-icons/pi';
import { FaGun, FaUserSecret } from 'react-icons/fa6';
import { CiSearch, CiEdit, CiBoxes } from 'react-icons/ci';
import {
  BiLogOutCircle,
  BiCategory,
  BiSolidCity,
  BiSortAlt2,
} from 'react-icons/bi';
import {
  HiOutlineChevronRight,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';
import { TbDots } from 'react-icons/tb';
import {
  LiaGlobeSolid,
  LiaUser,
  LiaUserAltSlashSolid,
  LiaFilePrescriptionSolid,
  LiaBoxesSolid,
} from 'react-icons/lia';
import { SiAwsorganizations } from 'react-icons/si';
import { GoEye, GoWorkflow, GoMoon, GoCheck } from 'react-icons/go';

import {
  BsFileEarmarkSlides,
  BsFiletypeDoc,
  BsSignIntersectionT,
  BsBox,
} from 'react-icons/bs';
import {
  TbHexagonLetterH,
  TbHexagonLetterE,
  TbHexagonLetterD,
  TbDatabaseExport,
  TbDatabaseImport,
} from 'react-icons/tb';
import { VscTypeHierarchySub, VscTable } from 'react-icons/vsc';
import { LogoIcon } from './custom-icons';

export const appIcons = {
  logo: LogoIcon,
  dashboard: MdDashboard,
  intel: FaSitemap,

  // MAIN ENTITIES
  personnel: FaPersonMilitaryRifle,
  civilPersonnel: FaPersonMilitaryRifle,
  militaryPersonnel: FaPersonMilitaryRifle,
  companies: HiOutlineBuildingOffice2,
  equipment: FaGun,
  tools: FaTools,
  documents: IoMdPaper,

  settings: FiSettings,
  users: FaUserSecret,

  // LOOK-UP
  countries: MdFireplace,
  regions: LiaGlobeSolid,
  organizations: SiAwsorganizations,
  branches: PiGitBranchBold,
  directorates: LuCommand,

  database: FiDatabase,
  database_import: TbDatabaseImport,
  database_export: TbDatabaseExport,
  headQuarters: BiSolidCity,
  formations: CiBoxes,
  units: LiaBoxesSolid,
  subUnits: BsBox,

  docTypes: BsFiletypeDoc,
  docTypeCategories: BiCategory,
  departments: BsSignIntersectionT,
  sectors: VscTypeHierarchySub,
  positions: GoWorkflow,

  light: MdWbSunny,
  dark: GoMoon,

  chevronDown: FiChevronDown,
  chevronUp: FiChevronUp,
  chevronLeft: FiChevronLeft,
  chevronRight: FiChevronRight,

  table: VscTable,
  cards: PiCreditCardLight,

  // ACTIONS
  upload: LuUpload,
  sort: BiSortAlt2,
  add: IoAdd,
  edit: CiEdit,
  view: GoEye,
  delete: PiTrashThin,
  close: AiOutlineClose,
  reset: MdLockReset,
  search: CiSearch,
  check: GoCheck,
  file: LiaFilePrescriptionSolid,

  dots_menu: TbDots,
  arrow_right: HiOutlineChevronRight,
  arrow_down: LuChevronDown,
  arrow_up_down: LuArrowUpDown,
  logout: BiLogOutCircle,
  menu: FaList,
  flag: PiFlagLight,
  download: IoDownloadSharp,
  previous: MdOutlineKeyboardDoubleArrowLeft,
  next: MdOutlineKeyboardDoubleArrowRight,

  // PAPERS
  daily: TbHexagonLetterH,
  weekly: TbHexagonLetterE,
  'info-doc': TbHexagonLetterD,
  armament: BsFileEarmarkSlides,

  // USERS
  user_head: CgUserList,
  user_manager: RiUser2Line,
  user_user: RiUserSettingsLine,
  user_admin: RiAdminLine,
  user_deactivate: LiaUserAltSlashSolid,
  user_activate: LiaUser,
};
