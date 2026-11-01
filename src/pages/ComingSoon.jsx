import { Link } from 'react-router-dom';
import { HiArrowLeft, HiSparkles, HiLockClosed } from 'react-icons/hi2';
export default function ComingSoon({title='Something exciting is on the way',section='In development'}){
  return (
    <div className="demo-coming-shell">
      <div className="demo-coming-card">
        <span className="demo-coming-eyebrow"><HiSparkles /> {section}</span>
        <div className="demo-coming-icon" aria-hidden><HiLockClosed /></div>
        <h1>{title}</h1>
        <p>This feature is being refined for the full experience. You can explore the working parts of the application in the meantime.</p>
        <span className="demo-coming-status">COMING SOON <span>✦</span></span>
        <Link to="/dashboard" className="demo-coming-back"><HiArrowLeft /> Back to Dashboard</Link>
      </div>
    </div>
  );
}
