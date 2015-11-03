#line 1 "C:/Perl/lib/File/Spec/Win32.pm"
package File::Spec::Win32;

use strict;

use vars qw(@ISA $VERSION);
require File::Spec::Unix;

$VERSION = '1.5';

@ISA = qw(File::Spec::Unix);

#line 33

sub devnull {
    return "nul";
}

#line 58

my $tmpdir;
sub tmpdir {
    return $tmpdir if defined $tmpdir;
    my $self = shift;
    $tmpdir = $self->_tmpdir( @ENV{qw(TMPDIR TEMP TMP)},
			      'SYS:/temp',
			      'C:/temp',
			      '/tmp',
			      '/'  );
}

sub case_tolerant {
    return 1;
}

sub file_name_is_absolute {
    my ($self,$file) = @_;
    return scalar($file =~ m{^([a-z]:)?[\\/]}is);
}

#line 85

sub catfile {
    my $self = shift;
    my $file = $self->canonpath(pop @_);
    return $file unless @_;
    my $dir = $self->catdir(@_);
    $dir .= "\\" unless substr($dir,-1) eq "\\";
    return $dir.$file;
}

sub catdir {
    my $self = shift;
    my @args = @_;
    foreach (@args) {
	tr[/][\\];
        # append a backslash to each argument unless it has one there
        $_ .= "\\" unless m{\\$};
    }
    return $self->canonpath(join('', @args));
}

sub path {
    my $path = $ENV{'PATH'} || $ENV{'Path'} || $ENV{'path'};
    my @path = split(';',$path);
    foreach (@path) { $_ = '.' if $_ eq '' }
    return @path;
}

#line 123

sub canonpath {
    my ($self,$path) = @_;
    my $orig_path = $path;
    $path =~ s/^([a-z]:)/\u$1/s;
    $path =~ s|/|\\|g;
    $path =~ s|([^\\])\\+|$1\\|g;                  # xx\\\\xx  -> xx\xx
    $path =~ s|(\\\.)+\\|\\|g;                     # xx\.\.\xx -> xx\xx
    $path =~ s|^(\.\\)+||s unless $path eq ".\\";  # .\xx      -> xx
    $path =~ s|\\\Z(?!\n)||
	unless $path =~ m{^([A-Z]:)?\\\Z(?!\n)}s;  # xx\       -> xx
    # xx1/xx2/xx3/../../xx -> xx1/xx
    $path =~ s|\\\.\.\.\\|\\\.\.\\\.\.\\|g; # \...\ is 2 levels up
    $path =~ s|^\.\.\.\\|\.\.\\\.\.\\|g;    # ...\ is 2 levels up
    return $path if $path =~ m|^\.\.|;      # skip relative paths
    return $path unless $path =~ /\.\./;    # too few .'s to cleanup
    return $path if $path =~ /\.\.\.\./;    # too many .'s to cleanup
    $path =~ s{^\\\.\.$}{\\};                      # \..    -> \
    1 while $path =~ s{^\\\.\.}{};                 # \..\xx -> \xx

    my ($vol,$dirs,$file) = $self->splitpath($path);
    my @dirs = $self->splitdir($dirs);
    my (@base_dirs, @path_dirs);
    my $dest = \@base_dirs;
    for my $dir (@dirs){
	$dest = \@path_dirs if $dir eq $self->updir;
	push @$dest, $dir;
    }
    # for each .. in @path_dirs pop one item from 
    # @base_dirs
    while (my $dir = shift @path_dirs){ 
	unless ($dir eq $self->updir){
	    unshift @path_dirs, $dir;
	    last;
	}
	pop @base_dirs;
    }
    $path = $self->catpath( 
			   $vol, 
			   $self->catdir(@base_dirs, @path_dirs), 
			   $file
			  );
    return $path;
}

#line 186

sub splitpath {
    my ($self,$path, $nofile) = @_;
    my ($volume,$directory,$file) = ('','','');
    if ( $nofile ) {
        $path =~ 
            m{^( (?:[a-zA-Z]:|(?:\\\\|//)[^\\/]+[\\/][^\\/]+)? ) 
                 (.*)
             }xs;
        $volume    = $1;
        $directory = $2;
    }
    else {
        $path =~ 
            m{^ ( (?: [a-zA-Z]: |
                      (?:\\\\|//)[^\\/]+[\\/][^\\/]+
                  )?
                )
                ( (?:.*[\\/](?:\.\.?\Z(?!\n))?)? )
                (.*)
             }xs;
        $volume    = $1;
        $directory = $2;
        $file      = $3;
    }

    return ($volume,$directory,$file);
}


#line 237

sub splitdir {
    my ($self,$directories) = @_ ;
    #
    # split() likes to forget about trailing null fields, so here we
    # check to be sure that there will not be any before handling the
    # simple case.
    #
    if ( $directories !~ m|[\\/]\Z(?!\n)| ) {
        return split( m|[\\/]|, $directories );
    }
    else {
        #
        # since there was a trailing separator, add a file name to the end, 
        # then do the split, then replace it with ''.
        #
        my( @directories )= split( m|[\\/]|, "${directories}dummy" ) ;
        $directories[ $#directories ]= '' ;
        return @directories ;
    }
}


#line 267

sub catpath {
    my ($self,$volume,$directory,$file) = @_;

    # If it's UNC, make sure the glue separator is there, reusing
    # whatever separator is first in the $volume
    $volume .= $1
        if ( $volume =~ m@^([\\/])[\\/][^\\/]+[\\/][^\\/]+\Z(?!\n)@s &&
             $directory =~ m@^[^\\/]@s
           ) ;

    $volume .= $directory ;

    # If the volume is not just A:, make sure the glue separator is 
    # there, reusing whatever separator is first in the $volume if possible.
    if ( $volume !~ m@^[a-zA-Z]:\Z(?!\n)@s &&
         $volume =~ m@[^\\/]\Z(?!\n)@      &&
         $file   =~ m@[^\\/]@
       ) {
        $volume =~ m@([\\/])@ ;
        my $sep = $1 ? $1 : '\\' ;
        $volume .= $sep ;
    }

    $volume .= $file ;

    return $volume ;
}


sub abs2rel {
    my($self,$path,$base) = @_;
    $base = $self->_cwd() unless defined $base and length $base;

    for ($path, $base) { $_ = $self->canonpath($_) }

    my ($path_volume) = $self->splitpath($path, 1);
    my ($base_volume) = $self->splitpath($base, 1);

    # Can't relativize across volumes
    return $path unless $path_volume eq $base_volume;

    for ($path, $base) { $_ = $self->rel2abs($_) }

    my $path_directories = ($self->splitpath($path, 1))[1];
    my $base_directories = ($self->splitpath($base, 1))[1];

    # Now, remove all leading components that are the same
    my @pathchunks = $self->splitdir( $path_directories );
    my @basechunks = $self->splitdir( $base_directories );

    while ( @pathchunks && 
            @basechunks && 
            lc( $pathchunks[0] ) eq lc( $basechunks[0] ) 
          ) {
        shift @pathchunks ;
        shift @basechunks ;
    }

    my $result_dirs = $self->catdir( ($self->updir) x @basechunks, @pathchunks );

    return $self->canonpath( $self->catpath('', $result_dirs, '') );
}


sub rel2abs {
    my ($self,$path,$base ) = @_;

    if ( ! $self->file_name_is_absolute( $path ) ) {

        if ( !defined( $base ) || $base eq '' ) {
	    require Cwd ;
	    $base = Cwd::getdcwd( ($self->splitpath( $path ))[0] ) if defined &Cwd::getdcwd ;
	    $base = $self->_cwd() unless defined $base ;
        }
        elsif ( ! $self->file_name_is_absolute( $base ) ) {
            $base = $self->rel2abs( $base ) ;
        }
        else {
            $base = $self->canonpath( $base ) ;
        }

        my ( $path_directories, $path_file ) =
            ($self->splitpath( $path, 1 ))[1,2] ;

        my ( $base_volume, $base_directories ) =
            $self->splitpath( $base, 1 ) ;

        $path = $self->catpath( 
            $base_volume, 
            $self->catdir( $base_directories, $path_directories ), 
            $path_file
        ) ;
    }

    return $self->canonpath( $path ) ;
}

#line 384

1;
