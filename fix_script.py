import re

def main():
    with open('src/pages/employee/EmployeeAppointmentsPage.tsx', 'r', encoding='utf-8') as f:
        employee_code = f.read()

    with open('src/pages/salon/SalonAppointmentsPage.tsx', 'r', encoding='utf-8') as f:
        salon_code = f.read()

    # 1. Update confirmAction state
    employee_code = re.sub(
        r'const \[confirmAction, setConfirmAction\] = useState<\{[^\}]+\}>\s*\(null\);',
        'const [confirmAction, setConfirmAction] = useState<{ appointmentId?: string; groupId?: string; isGroup: boolean; status: AppointmentStatus; label: string; actionText: string; reason: string; firstStartTime?: string; } | null>(null);',
        employee_code
    )

    # 2. Add requestSingleUpdate and requestGroupUpdate
    employee_code = re.sub(
        r'const requestStatusUpdate = \(.*?\) => \{\n\s*setConfirmAction\(\{.*?\n\s*\};\n\s*\};',
        '''const requestSingleUpdate = (id: string, status: AppointmentStatus, label: string, actionText: string, firstStartTime?: string) =>
        setConfirmAction({ appointmentId: id, isGroup: false, status, label, actionText, reason: '', firstStartTime });

    const requestGroupUpdate = (groupId: string, status: AppointmentStatus, label: string, actionText: string, firstStartTime?: string) =>
        setConfirmAction({ groupId, isGroup: true, status, label, actionText, reason: '', firstStartTime });''',
        employee_code,
        flags=re.DOTALL
    )

    # 3. Update handleStatusUpdate logic
    handle_update_new = '''const handleStatusUpdate = async () => {
        if (!confirmAction) return;
        const needsReason = confirmAction.status === AppointmentStatus.Rejected || confirmAction.status === AppointmentStatus.Cancelled;
        if (needsReason && !confirmAction.reason.trim()) {
            toast.error(confirmAction.status === AppointmentStatus.Rejected
                ? 'Red sebebi zorunludur — müşteri bu bilgiyi görecek.'
                : 'İptal sebebi zorunludur — müşteri bu bilgiyi görecek.'
            );
            return;
        }
        const reason = needsReason ? confirmAction.reason.trim() || undefined : undefined;
        const successMessages: Partial<Record<AppointmentStatus, string>> = {
            [AppointmentStatus.Confirmed]: confirmAction.isGroup ? 'Tüm randevular onaylandı.' : 'Randevu onaylandı.',
            [AppointmentStatus.Completed]: confirmAction.isGroup ? 'Tüm randevular tamamlandı olarak işaretlendi.' : 'Randevu tamamlandı olarak işaretlendi.',
            [AppointmentStatus.Cancelled]: confirmAction.isGroup ? 'Tüm randevular iptal edildi.' : 'Randevu iptal edildi.',
            [AppointmentStatus.Rejected]: confirmAction.isGroup ? 'Tüm randevular reddedildi.' : 'Randevu reddedildi.',
            [AppointmentStatus.NoShow]: confirmAction.isGroup ? 'Tüm randevular "Gelmedi" olarak işaretlendi.' : 'Randevu "Gelmedi" olarak işaretlendi.',
        };
        try {
            let noShowResult = null;
            if (confirmAction.isGroup && confirmAction.groupId) {
                noShowResult = await appointmentService.updateGroupStatusByEmployee(confirmAction.groupId, confirmAction.status, reason);
            } else if (confirmAction.appointmentId) {
                noShowResult = await appointmentService.updateStatusByEmployee(confirmAction.appointmentId, confirmAction.status, reason);
            }
            toast.success(successMessages[confirmAction.status] ?? 'Randevu güncellendi.');
            loadData();
            loadWeeklyAppointments();
            if (confirmAction.status === AppointmentStatus.NoShow && noShowResult && noShowResult.noShowCount >= 2 && noShowResult.customerId) {
                setBlockOffer({
                    customerId: noShowResult.customerId,
                    customerName: noShowResult.customerName ?? 'Müşteri',
                    noShowCount: noShowResult.noShowCount,
                });
            }
        } catch (err) { toast.error(getApiError(err, 'İşlem gerçekleştirilemedi, lütfen tekrar deneyin.')); }
        finally { setConfirmAction(null); }
    };'''

    employee_code = re.sub(
        r'const handleStatusUpdate = async \(\) => \{.*?finally \{ setConfirmAction\(null\); \}\n\s*\};',
        handle_update_new,
        employee_code,
        flags=re.DOTALL
    )

    # 4. Extract rendering from salon
    render_match = re.search(r'(<div className=\"divide-y divide-gray-100\">\n\s*\{\(\(\) => \{.*?\{/\* Confirmation Modal \*/\})', salon_code, re.DOTALL)
    
    if render_match:
        render_code = render_match.group(1)
        # We replace from {/\* Desktop Table \*/} up to {/\* Confirmation Modal \*/} in employee_code
        employee_code = re.sub(
            r'\{/\* Desktop Table \*/\}.*?\{/\* Confirmation Modal \*/\}',
            render_code,
            employee_code,
            flags=re.DOTALL
        )
        
        # We must also replace the Confirmation Modal in employee_code with the one from salon_code
        modal_match = re.search(r'\{/\* Confirmation Modal \*/\}.*?document\.body\n\s*\)', salon_code, re.DOTALL)
        if modal_match:
            modal_code = modal_match.group(0)
            employee_code = re.sub(
                r'\{/\* Confirmation Modal \*/\}.*?document\.body\n\s*\)',
                modal_code,
                employee_code,
                flags=re.DOTALL
            )
            
    with open('src/pages/employee/EmployeeAppointmentsPage.tsx', 'w', encoding='utf-8') as f:
        f.write(employee_code)

if __name__ == '__main__':
    main()
