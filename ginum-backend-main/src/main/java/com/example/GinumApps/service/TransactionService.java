package com.example.GinumApps.service;

import com.example.GinumApps.model.Transaction;
import com.example.GinumApps.dto.TransactionDto;
import com.example.GinumApps.dto.DirectPaymentRequestDto;
import com.example.GinumApps.dto.JournalEntryDto;
import com.example.GinumApps.dto.JournalEntryLineDto;
import com.example.GinumApps.enums.JournalEntryType;
import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.model.Account;
import com.example.GinumApps.model.Employee;
import com.example.GinumApps.model.JournalEntry;
import com.example.GinumApps.model.JournalEntryLine;
import com.example.GinumApps.model.PurchaseOrder;
import com.example.GinumApps.repository.TransactionRepository;
import com.example.GinumApps.repository.AccountRepository;
import com.example.GinumApps.repository.EmployeeRepository;
import com.example.GinumApps.repository.JournalEntryRepository;
import com.example.GinumApps.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.GinumApps.model.Company;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.exception.ResourceNotFoundException;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private AccountRepository accountRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private JournalEntryRepository journalEntryRepo;

    @Autowired
    private JournalEntryService journalEntryService;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepo;

    public List<Transaction> getAllTransactions(Integer companyId) {
        return transactionRepository.findByCompanyId(companyId);
    }

    public Transaction saveTransaction(Integer companyId, TransactionDto dto) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        Transaction transaction = new Transaction();
        transaction.setReferenceNumber(dto.getReferenceNumber());
        transaction.setDate(dto.getDate());
        transaction.setDescription(dto.getDescription());
        transaction.setTotalDebit(dto.getTotalDebit());
        transaction.setTotalCredit(dto.getTotalCredit());
        transaction.setCompany(company);

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction processDirectPayment(Integer companyId, DirectPaymentRequestDto dto) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        String payeeName = "Unknown Payee";
        if ("EMPLOYEE".equalsIgnoreCase(dto.getPayeeType())) {
            Employee emp = employeeRepo.findById(dto.getPayeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
            payeeName = emp.getFirstName() + " " + emp.getLastName();
        } else if ("SUPPLIER".equalsIgnoreCase(dto.getPayeeType())) {
            payeeName = "Supplier " + dto.getPayeeId();
        } else {
            payeeName = "Other (" + dto.getPayeeType() + ")";
        }

        Transaction transaction = new Transaction();
        transaction.setReferenceNumber(dto.getReferenceNumber());
        transaction.setDate(LocalDate.now().toString());
        transaction.setDescription("Spend Money - " + payeeName + (dto.getPaymentNote() != null && !dto.getPaymentNote().trim().isEmpty() ? " - " + dto.getPaymentNote() : ""));
        transaction.setTotalDebit(0.0);
        transaction.setTotalCredit(dto.getAmount().doubleValue());
        transaction.setCompany(company);
        
        transaction.setPayeeType(dto.getPayeeType());
        transaction.setPayeeId(dto.getPayeeId());
        transaction.setPayeeName(payeeName);
        transaction.setPaymentCategory(dto.getPaymentCategory());
        transaction.setPaymentMethod(dto.getPaymentMethod());
        transaction.setPaymentAccountCode(dto.getPaymentAccountCode());

        Transaction savedTx = transactionRepository.save(transaction);

        JournalEntryDto journalDto = new JournalEntryDto();
        journalDto.setEntryType(JournalEntryType.PAYMENT);
        journalDto.setEntryDate(LocalDate.now());
        journalDto.setJournalTitle("Spend Money Direct");
        journalDto.setReferenceNo(dto.getReferenceNumber());
        journalDto.setCompanyId(companyId);
        journalDto.setDescription(transaction.getDescription());

        List<JournalEntryLineDto> lines = new ArrayList<>();
        // Debit: Expense Account
        lines.add(new JournalEntryLineDto(dto.getExpenseAccountCode(), dto.getAmount(), true, dto.getPaymentNote()));
        // Credit: Payment Bank Account
        lines.add(new JournalEntryLineDto(dto.getPaymentAccountCode(), dto.getAmount(), false, dto.getPaymentNote()));
        journalDto.setLines(lines);

        journalEntryService.createJournalEntry(journalDto);

        return savedTx;
    }

    @Transactional
    public void deleteTransaction(Integer companyId, Integer transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        
        if (!tx.getCompany().getCompanyId().equals(companyId)) {
            throw new IllegalArgumentException("Transaction does not belong to this company");
        }

        // Revert related journal entry
        List<JournalEntry> entries = journalEntryRepo.findByCompany_CompanyId(companyId);
        for (JournalEntry je : entries) {
            if (je.getReferenceNo() != null && je.getReferenceNo().equals(tx.getReferenceNumber())) {
                for (JournalEntryLine line : je.getJournalEntryLines()) {
                    Account account = line.getAccount();
                    BigDecimal amount = line.getAmount();
                    boolean isDebit = line.isDebit();

                    boolean isDebitNormal = account.getAccountType().isDebitType();
                    BigDecimal balanceChange;
                    if (isDebitNormal) {
                        balanceChange = isDebit ? amount : amount.negate();
                    } else {
                        balanceChange = isDebit ? amount.negate() : amount;
                    }

                    account.setCurrentBalance(account.getCurrentBalance().subtract(balanceChange));
                    accountRepo.save(account);
                }
                journalEntryRepo.delete(je);
                break;
            }
        }

        // Revert PO if it's a PO payment
        if (tx.getDescription() != null && tx.getDescription().contains("PO:")) {
            String desc = tx.getDescription();
            int poStart = desc.lastIndexOf("PO: ");
            if (poStart != -1) {
                String poNum = desc.substring(poStart + 4, desc.length() - 1);
                Optional<PurchaseOrder> poOpt = purchaseOrderRepo.findByPoNumberAndCompany_CompanyId(poNum, companyId);
                if (poOpt.isPresent()) {
                    PurchaseOrder po = poOpt.get();
                    BigDecimal amount = BigDecimal.valueOf(tx.getTotalCredit());
                    po.setAmountPaid(po.getAmountPaid().subtract(amount));
                    po.setBalanceDue(po.getBalanceDue().add(amount));
                    purchaseOrderRepo.save(po);
                }
            }
        }

        transactionRepository.delete(tx);
    }
}
